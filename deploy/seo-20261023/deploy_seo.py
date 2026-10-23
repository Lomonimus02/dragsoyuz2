import hashlib,json,pathlib,shutil,subprocess,sys,tarfile,time,urllib.request,urllib.parse,shlex,secrets
BASE=pathlib.Path('/srv/radioklad')
WORK=BASE/'import/seo-tz-20261023'
NEW=BASE/'releases/20261023-seo-tz'
SERVICE=pathlib.Path('/etc/systemd/system/radioklad-web.service')
NGINX=pathlib.Path('/etc/nginx/sites-available/radio-klad.ru')
PREVIEW_CONF=pathlib.Path('/etc/nginx/conf.d/radioklad-seo-preview.conf')
PREVIEW='radioklad-seo-tz-preview'
DB='radioklad_seo_tz_test_20261023'
def run(*args):return subprocess.check_output(args,text=True,stderr=subprocess.STDOUT).strip()
def sha(p):return hashlib.sha256(pathlib.Path(p).read_bytes()).hexdigest()
def save(name,data):(WORK/name).write_text(json.dumps(data,ensure_ascii=False,indent=2))
def query(sql,db='radioklad'):
 return run('docker','exec','radioklad-db','psql','-v','ON_ERROR_STOP=1','-U','radioklad','-d',db,'-t','-A','-c',sql)
def original():return run('docker','inspect','--format','{{.Name}} {{.Id}} {{.State.StartedAt}} {{.RestartCount}}','radiodetali_app','radiodetali_db')
def catalog_hash():
 sql='''SELECT json_build_object('products',(SELECT json_agg(to_jsonb(p)-'seoTitle'-'seoH1'-'seoDescription'-'updatedAt'- CASE WHEN p.slug='130-133-i-podobnye-14-nog-0-podlozhek' THEN 'pageDescription' ELSE '__none__' END ORDER BY p.id) FROM products p),'categories',(SELECT json_agg(c ORDER BY c.id) FROM categories c),'settings',(SELECT json_agg(s ORDER BY s.id) FROM global_settings s))'''
 return hashlib.sha256(query(sql).encode()).hexdigest()
def snapshot():
 return {'original':original(),'catalog_hash':catalog_hash(),'files':{str(p):sha(p) for p in pathlib.Path('/etc/nginx').rglob('*') if p.is_file() and p.resolve()!=NGINX.resolve() and p!=PREVIEW_CONF},'env':sha(BASE/'app.env'),'uploads':{str(p.relative_to(BASE/'shared/uploads')):sha(p) for p in (BASE/'shared/uploads').rglob('*') if p.is_file()}}
def protected():assert snapshot()==json.loads((WORK/'before.json').read_text()),'Protected production state changed; re-inspect before activation'
def get(path,port=3164):
 with urllib.request.urlopen(f'http://127.0.0.1:{port}'+path,timeout=40) as r:return r.read()
def wait(port):
 for i in range(25):
  try:get('/',port);return
  except Exception:
   if i==24:raise
   time.sleep(1)
def migrate(db,reverse=False):
 changes=json.loads((WORK/'metadata-updates.json').read_text())
 def lit(v):return 'NULL' if v is None else "'"+str(v).replace("'","''")+"'"
 sql=['BEGIN;', 'ALTER TABLE products ADD COLUMN IF NOT EXISTS "seoTitle" TEXT;']
 for row in changes:
  before,after=row['before'],row['after']
  expected=after if reverse else before
  updates={k:before.get(k) for k in after} if reverse else after
  where=['slug='+lit(row['slug'])]+['"'+k+'" IS NOT DISTINCT FROM '+lit(v) for k,v in expected.items() if k not in ('categorySlug',)]
  if not reverse:where.append('"categoryId"=(SELECT id FROM categories WHERE slug='+lit(before['categorySlug'])+')')
  condition=' AND '.join(where)
  sql.append('DO $seo$ BEGIN IF NOT EXISTS (SELECT 1 FROM products WHERE '+condition+") THEN RAISE EXCEPTION 'Catalog changed since audit: "+row['slug']+"'; END IF; END $seo$;")
  sql.append('UPDATE products SET '+','.join('"'+k+'"='+lit(v) for k,v in updates.items())+',"updatedAt"=NOW() WHERE '+condition+';')
 sql.append('COMMIT;')
 stdin=subprocess.run(['docker','exec','-i','radioklad-db','psql','-v','ON_ERROR_STOP=1','-U','radioklad','-d',db],input='\n'.join(sql),text=True,capture_output=True)
 if stdin.returncode:raise RuntimeError(stdin.stderr[-1800:])
 assert stdin.stdout.count('UPDATE 1')==245
def stage_db():
 assert not query("SELECT datname FROM pg_database WHERE datname='"+DB+"'")
 run('docker','exec','radioklad-db','createdb','-U','radioklad',DB)
 with (WORK/'production-before.dump').open('rb') as source:
  subprocess.run(['docker','exec','-i','radioklad-db','pg_restore','-U','radioklad','-d',DB,'--no-owner','--no-acl'],stdin=source,check=True)
 query('''UPDATE global_settings SET "adminPasswordHash"=NULL,"telegramBotToken"='',"telegramChatId"='' ''',DB)
 env={}
 for line in (BASE/'app.env').read_text().splitlines():
  if line.strip() and not line.lstrip().startswith('#') and '=' in line:
   k,v=line.split('=',1);env[k]=shlex.split(v)[0] if v else ''
 url=urllib.parse.urlsplit(env['DATABASE_URL']);env['DATABASE_URL']=urllib.parse.urlunsplit(url._replace(path='/'+DB))
 env['ADMIN_PASSWORD']=secrets.token_urlsafe(24);env['ADMIN_SESSION_SECRET']=secrets.token_urlsafe(32)
 env['JIVO_WIDGET_ID']='';env['NEXT_PUBLIC_JIVO_WIDGET_ID']='';env['NEXT_PUBLIC_YANDEX_METRIKA_ID']=''
 (WORK/'preview.env').write_text('\n'.join(k+'='+json.dumps(v,ensure_ascii=False) for k,v in env.items())+'\n');(WORK/'preview.env').chmod(0o600)
 (WORK/'preview-login.txt').write_text(env['ADMIN_PASSWORD']);(WORK/'preview-login.txt').chmod(0o600)
 migrate(DB)
def smoke(port):
 html=get('/catalog/mikroshemy/130-133-i-podobnye-14-nog-0-podlozhek',port).decode()
 assert 'DIP-16' not in html and '16 выводов' not in html
 assert '632-01-05' not in html
 assert 'Скупка: 130,133' in html
 assert b'<loc>' in get('/sitemap.xml',port)
 old=pathlib.Path((WORK/'old-release.txt').read_text())
 for name in ['google099eddbdad985634.html','yandex_a4d272112e2137fb.html','8997753dd62124dede7e5cdf7d1cd306.txt']:
  assert get('/'+name,port)==(old/'public'/name).read_bytes()
def extract():
 assert sha(WORK/'seo-release.tar.gz')==json.loads((WORK/'seo-manifest.json').read_text())['sha256']
 with tarfile.open(WORK/'seo-release.tar.gz') as tar:
  for m in tar.getmembers():
   assert m.isfile() and (NEW/m.name).resolve().is_relative_to(NEW)
   assert not pathlib.Path(m.name).name.startswith('.env')
   if m.name.startswith('node_modules/'):assert m.name.startswith('node_modules/.prisma/client/')
   assert not m.name.startswith('public/')
  tar.extractall(NEW)
def preview_start():
 run('systemd-run','--unit='+PREVIEW,'--property=User=radioklad','--property=Group=radioklad','--property=WorkingDirectory='+str(NEW),'--property=EnvironmentFile='+str(WORK/'preview.env'),'--property=MemoryMax=450M','--property=MemorySwapMax=0','--property=CPUQuota=45%','--property=TasksMax=80','--property=NoNewPrivileges=true','/usr/bin/env','PORT=3164','HOSTNAME=127.0.0.1',str(BASE/'runtime/node'),'server.js')
 wait(3164)
mode=sys.argv[1]
if mode=='prepare':
 assert WORK.is_dir() and not (WORK/'before.json').exists() and not NEW.exists()
 assert not PREVIEW_CONF.exists()
 old=run('systemctl','show','radioklad-web','-p','WorkingDirectory','--value')
 assert old=='/srv/radioklad/releases/20261023-manual-quantity', 'Production release changed; merge its source first'
 (WORK/'old-release.txt').write_text(old)
 shutil.copy2(SERVICE,WORK/'web.service.before');shutil.copy2(NGINX,WORK/'nginx.before')
 save('before.json',snapshot())
 with (WORK/'production-before.dump').open('wb') as output:subprocess.run(['docker','exec','radioklad-db','pg_dump','-U','radioklad','-d','radioklad','--format=custom','--no-owner','--no-acl'],stdout=output,check=True)
 (WORK/'production-before.dump').chmod(0o600)
 print('Backup and protected-state snapshot saved')
elif mode=='stage':
 protected();assert not NEW.exists()
 old=pathlib.Path((WORK/'old-release.txt').read_text());NEW.mkdir()
 for name in ['node_modules','public']:shutil.copytree(old/name,NEW/name,symlinks=True)
 shutil.copy2(old/'package.json',NEW/'package.json');extract()
 for p in (old/'.next/static').rglob('*'):
  if p.is_file():
   dest=NEW/'.next/static'/p.relative_to(old/'.next/static')
   if not dest.exists():dest.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(p,dest)
 assert (NEW/'public/uploads').is_symlink() and (NEW/'public/uploads').resolve()==BASE/'shared/uploads'
 (NEW/'public/uploads').unlink();shutil.copytree(BASE/'shared/uploads',NEW/'.preview-uploads');(NEW/'public/uploads').symlink_to(NEW/'.preview-uploads')
 (NEW/'.next/cache').mkdir(exist_ok=True);run('chown','-R','radioklad:radioklad',str(NEW))
 stage_db();preview_start();smoke(3164)
 shutil.copy2(WORK/'preview.nginx.conf',PREVIEW_CONF);run('nginx','-t');run('systemctl','reload','nginx')
 protected();print('Private preview and cloned database ready on 3165')
elif mode=='refresh':
 protected();run('systemctl','stop',PREVIEW);extract();run('chown','-R','radioklad:radioklad',str(NEW));run('systemctl','start',PREVIEW);wait(3164);smoke(3164)
 print('Preview refreshed')
elif mode=='rebase-contact-release':
 protected()
 old=run('systemctl','show','radioklad-web','-p','WorkingDirectory','--value')
 assert old=='/srv/radioklad/releases/20261023-contact-jivo'
 assert (WORK/'old-release.txt').read_text()=='/srv/radioklad/releases/20261023-manual-quantity'
 assert NGINX.read_bytes()==(WORK/'nginx.before').read_bytes()
 shutil.copy2(WORK/'web.service.before',WORK/'web.service.original-before')
 shutil.copy2(SERVICE,WORK/'web.service.before');(WORK/'old-release.txt').write_text(old)
 for p in (pathlib.Path(old)/'.next/static').rglob('*'):
  if p.is_file():
   dest=NEW/'.next/static'/p.relative_to(pathlib.Path(old)/'.next/static')
   if not dest.exists():dest.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(p,dest)
 print('Rollback baseline updated to the verified contact/Jivo release')
elif mode=='activate':
 protected();check=json.loads((WORK/'preview-verification.json').read_text());assert check['passed'] and check['pages']==280
 old=(WORK/'old-release.txt').read_text();assert run('systemctl','show','radioklad-web','-p','WorkingDirectory','--value')==old
 assert SERVICE.read_bytes()==(WORK/'web.service.before').read_bytes() and NGINX.read_bytes()==(WORK/'nginx.before').read_bytes()
 service=SERVICE.read_text();run('systemctl','stop',PREVIEW)
 (NEW/'public/uploads').unlink();(NEW/'public/uploads').symlink_to(BASE/'shared/uploads')
 migrated=False
 try:
  migrate('radioklad');migrated=True
  SERVICE.write_text(service.replace(old,str(NEW)));NGINX.write_bytes((WORK/'radio-klad.nginx.conf').read_bytes())
  run('nginx','-t');run('systemctl','daemon-reload');run('systemctl','restart','radioklad-web');wait(3160);smoke(3160)
  run('systemctl','reload','nginx');protected()
 except Exception:
  SERVICE.write_text(service);NGINX.write_bytes((WORK/'nginx.before').read_bytes())
  if migrated:migrate('radioklad',reverse=True)
  run('systemctl','daemon-reload');run('systemctl','restart','radioklad-web');run('nginx','-t');run('systemctl','reload','nginx');raise
 save('activation.json',{'release':str(NEW),'build_id':(NEW/'.next/BUILD_ID').read_text().strip(),'products_updated':245,'protected_state_unchanged':True})
 print((WORK/'activation.json').read_text())
elif mode=='cleanup':
 protected();assert run('systemctl','show','radioklad-web','-p','WorkingDirectory','--value')==str(NEW)
 assert DB=='radioklad_seo_tz_test_20261023'
 run('docker','exec','radioklad-db','dropdb','-U','radioklad','--if-exists','--force',DB)
 PREVIEW_CONF.unlink(missing_ok=True);run('nginx','-t');run('systemctl','reload','nginx')
 for name in ['preview.env','preview-login.txt']:(WORK/name).unlink(missing_ok=True)
 print('Preview stopped and test credentials removed; backup retained')
else:raise ValueError(mode)
