import concurrent.futures,html.parser,json,pathlib,re,sys,time,urllib.request,urllib.parse,urllib.error
W=pathlib.Path('/srv/radioklad/import/seo-tz-20261023')
production='--public' in sys.argv
BASE='https://radio-klad.ru' if production else 'http://127.0.0.1:3165'
CANON='https://radio-klad.ru'
class NoRedirect(urllib.request.HTTPRedirectHandler):
 def redirect_request(self,*a,**k):return None
opener=urllib.request.build_opener(NoRedirect)
def get(path,method='GET'):
 url=path if path.startswith(('http://','https://')) else BASE+path
 req=urllib.request.Request(url,method=method,headers={'User-Agent':'RadioKlad SEO verification'})
 try:r=opener.open(req,timeout=45)
 except urllib.error.HTTPError as e:r=e
 with r:return r.status,dict((k.lower(),v) for k,v in r.headers.items()),r.read().decode('utf8',errors='replace')
class Parser(html.parser.HTMLParser):
 def __init__(self):super().__init__();self.title=[];self.h1=[];self.canonical=[];self.desc=[];self.hrefs=[];self.robots=[];self.active=None
 def handle_starttag(self,tag,attrs):
  a=dict(attrs)
  if tag in ['title','h1']:self.active=[]
  if tag=='link' and a.get('rel')=='canonical':self.canonical.append(a.get('href'))
  if tag=='meta' and a.get('name')=='description':self.desc.append(a.get('content'))
  if tag=='meta' and a.get('name')=='robots':self.robots.append(a.get('content'))
  if tag=='a':self.hrefs.append(a.get('href',''))
 def handle_data(self,text):
  if self.active is not None:self.active.append(text)
 def handle_endtag(self,tag):
  if tag in ['title','h1'] and self.active is not None:getattr(self,tag).append(re.sub(r'\s+',' ',''.join(self.active)).strip());self.active=None
expected=json.loads((W/'expected-pages.json').read_text())
results=[];errors=[]
def check(item):
 path,copy=item;status,headers,text=get(path);p=Parser();p.feed(text)
 failures=[]
 if status!=200:failures.append('HTTP '+str(status))
 for key,actual in [('title',p.title),('h1',p.h1),('description',p.desc)]:
  if actual!=[copy[key]]:failures.append(f'{key}: {actual!r} != {copy[key]!r}')
 canonical=CANON+(path if path!='/' else '')
 if p.canonical!=[canonical]:failures.append('canonical '+repr(p.canonical))
 if any('noindex' in r for r in p.robots):failures.append('noindex')
 if '632-01-05' in ' '.join(p.desc):failures.append('Old phone remains')
 return {'path':path,'status':status,'title':p.title,'h1':p.h1,'canonical':p.canonical,'failures':failures,'hrefs':p.hrefs}
with concurrent.futures.ThreadPoolExecutor(max_workers=3) as ex:
 for result in ex.map(check,expected.items()):
  results.append(result)
  if result['failures']:errors.append(result)

redirects=[]
for item in json.loads((W/'redirect-cases.json').read_text()):
 original,_,_,status,target,rule=item
 # Mirror redirects only exist on the public listener.
 if not production and urllib.parse.urlsplit(original).netloc=='www.radio-klad.ru' and urllib.parse.urlsplit(original).path=='/':continue
 if not production and original=='http://radio-klad.ru/':continue
 url=original if production else BASE+urllib.parse.urlsplit(original).path+('?' + urllib.parse.urlsplit(original).query if urllib.parse.urlsplit(original).query else '')
 for method in ['GET','HEAD']:
  actual,headers,_=get(url,method);location=headers.get('location','')
  if location.startswith('/'):location=CANON+location
  ok=actual==status and (not target or location==target)
  redirects.append({'url':original,'method':method,'status':actual,'location':location,'passed':ok})
  if not ok:errors.append(redirects[-1])
aliases=json.loads((W/'aliases.json').read_text())
alias_paths={urllib.parse.urlsplit(row[0]).path for row in aliases}
for row in aliases:
 path=urllib.parse.urlsplit(row[0]).path
 status,headers,_=get(path,'HEAD');location=headers.get('location','')
 if location.startswith('/'):location=CANON+location
 if status!=301 or location!=row[3]:errors.append({'alias':path,'status':status,'location':location})
for result in results:
 bad=[href for href in result.pop('hrefs') if urllib.parse.urlsplit(href).path in alias_paths]
 if bad:errors.append({'path':result['path'],'links_to_aliases':bad})
for path in ['/seo-audit-not-found-20261023','/catalog/rele/no-such-part-20261023','/catalog/seo-category-missing']:
 status,_,text=get(path);p=Parser();p.feed(text)
 if status!=404 or p.canonical:errors.append({'missing':path,'status':status,'canonical':p.canonical})
status,_,sitemap=get('/sitemap.xml')
if status!=200 or len(re.findall('<loc>',sitemap))!=280:errors.append({'sitemap_status':status,'count':sitemap.count('<loc>')})
for path in ['/cart','/search?q=130','/admin/login','/api/health']:
 status,_,_=get(path)
 if status!=200:errors.append({'smoke':path,'status':status})
status,headers,_=get('/admin')
if status not in (302,303,307) or '/admin/login' not in headers.get('location',''):errors.append({'admin_guest':status,'location':headers.get('location')})
report={'passed':not errors,'pages':len(results),'aliases':len(aliases),'redirect_requests':len(redirects),'production':production,'errors':errors,'redirects':redirects,'results':results}
out=W/('public-verification.json' if production else 'preview-verification.json');out.write_text(json.dumps(report,ensure_ascii=False,indent=2))
print(json.dumps({k:v for k,v in report.items() if k not in ('results','redirects')},ensure_ascii=False))
if errors:sys.exit(1)
