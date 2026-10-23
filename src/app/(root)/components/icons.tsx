import type { Icon, IconProps, IconWeight } from "@phosphor-icons/react";
import { WarningCircleIcon as AlertCircleGlyph } from "@phosphor-icons/react/dist/ssr/WarningCircle";
import { WarningIcon as AlertTriangleGlyph } from "@phosphor-icons/react/dist/ssr/Warning";
import { TextAlignJustifyIcon as AlignJustifyGlyph } from "@phosphor-icons/react/dist/ssr/TextAlignJustify";
import { ArrowDownIcon as ArrowDownGlyph } from "@phosphor-icons/react/dist/ssr/ArrowDown";
import { ArrowLeftIcon as ArrowLeftGlyph } from "@phosphor-icons/react/dist/ssr/ArrowLeft";
import { ArrowRightIcon as ArrowRightGlyph } from "@phosphor-icons/react/dist/ssr/ArrowRight";
import { MoneyIcon as BanknoteGlyph } from "@phosphor-icons/react/dist/ssr/Money";
import { BookOpenTextIcon as BookOpenGlyph } from "@phosphor-icons/react/dist/ssr/BookOpenText";
import { PlugsConnectedIcon as CableGlyph } from "@phosphor-icons/react/dist/ssr/PlugsConnected";
import { CalculatorIcon as CalculatorGlyph } from "@phosphor-icons/react/dist/ssr/Calculator";
import { CheckCircleIcon as CheckCircleGlyph } from "@phosphor-icons/react/dist/ssr/CheckCircle";
import { CaretLeftIcon as ChevronLeftGlyph } from "@phosphor-icons/react/dist/ssr/CaretLeft";
import { CaretRightIcon as ChevronRightGlyph } from "@phosphor-icons/react/dist/ssr/CaretRight";
import { CircuitryIcon as CircuitBoardGlyph } from "@phosphor-icons/react/dist/ssr/Circuitry";
import { ClipboardTextIcon as ClipboardListGlyph } from "@phosphor-icons/react/dist/ssr/ClipboardText";
import { ClockIcon as ClockGlyph } from "@phosphor-icons/react/dist/ssr/Clock";
import { CpuIcon as CpuGlyph } from "@phosphor-icons/react/dist/ssr/Cpu";
import { DiscIcon as DiscGlyph } from "@phosphor-icons/react/dist/ssr/Disc";
import { ArrowSquareOutIcon as ExternalLinkGlyph } from "@phosphor-icons/react/dist/ssr/ArrowSquareOut";
import { HardDrivesIcon as HardDriveGlyph } from "@phosphor-icons/react/dist/ssr/HardDrives";
import { HouseLineIcon as HomeGlyph } from "@phosphor-icons/react/dist/ssr/HouseLine";
import { InfoIcon as InfoGlyph } from "@phosphor-icons/react/dist/ssr/Info";
import { CircleNotchIcon as Loader2Glyph } from "@phosphor-icons/react/dist/ssr/CircleNotch";
import { EnvelopeSimpleIcon as MailGlyph } from "@phosphor-icons/react/dist/ssr/EnvelopeSimple";
import { MapPinIcon as MapPinGlyph } from "@phosphor-icons/react/dist/ssr/MapPin";
import { MapTrifoldIcon as MapPinnedGlyph } from "@phosphor-icons/react/dist/ssr/MapTrifold";
import { ListIcon as MenuGlyph } from "@phosphor-icons/react/dist/ssr/List";
import { ChatCircleDotsIcon as MessageCircleGlyph } from "@phosphor-icons/react/dist/ssr/ChatCircleDots";
import { ChatTextIcon as MessageSquareGlyph } from "@phosphor-icons/react/dist/ssr/ChatText";
import { MinusIcon as MinusGlyph } from "@phosphor-icons/react/dist/ssr/Minus";
import { PackageIcon as PackageGlyph } from "@phosphor-icons/react/dist/ssr/Package";
import { PencilSimpleLineIcon as PencilGlyph } from "@phosphor-icons/react/dist/ssr/PencilSimpleLine";
import { PhoneCallIcon as PhoneGlyph } from "@phosphor-icons/react/dist/ssr/PhoneCall";
import { PlusIcon as PlusGlyph } from "@phosphor-icons/react/dist/ssr/Plus";
import { PrinterIcon as PrinterGlyph } from "@phosphor-icons/react/dist/ssr/Printer";
import { QuotesIcon as QuoteGlyph } from "@phosphor-icons/react/dist/ssr/Quotes";
import { RadioIcon as RadioGlyph } from "@phosphor-icons/react/dist/ssr/Radio";
import { ArrowCounterClockwiseIcon as RotateCcwGlyph } from "@phosphor-icons/react/dist/ssr/ArrowCounterClockwise";
import { ScalesIcon as ScaleGlyph } from "@phosphor-icons/react/dist/ssr/Scales";
import { MagnifyingGlassIcon as SearchGlyph } from "@phosphor-icons/react/dist/ssr/MagnifyingGlass";
import { PaperPlaneTiltIcon as SendGlyph } from "@phosphor-icons/react/dist/ssr/PaperPlaneTilt";
import { GearSixIcon as SettingsGlyph } from "@phosphor-icons/react/dist/ssr/GearSix";
import { ShieldCheckIcon as ShieldGlyph } from "@phosphor-icons/react/dist/ssr/ShieldCheck";
import { SparkleIcon as SparklesGlyph } from "@phosphor-icons/react/dist/ssr/Sparkle";
import { StarIcon as StarGlyph } from "@phosphor-icons/react/dist/ssr/Star";
import { TrashIcon as Trash2Glyph } from "@phosphor-icons/react/dist/ssr/Trash";
import { TrendUpIcon as TrendingUpGlyph } from "@phosphor-icons/react/dist/ssr/TrendUp";
import { TruckIcon as TruckGlyph } from "@phosphor-icons/react/dist/ssr/Truck";
import { XIcon as XGlyph } from "@phosphor-icons/react/dist/ssr/X";
import { LightningIcon as ZapGlyph } from "@phosphor-icons/react/dist/ssr/Lightning";
import { MagnifyingGlassPlusIcon as ZoomInGlyph } from "@phosphor-icons/react/dist/ssr/MagnifyingGlassPlus";
import { MagnifyingGlassMinusIcon as ZoomOutGlyph } from "@phosphor-icons/react/dist/ssr/MagnifyingGlassMinus";
import { TelegramLogoIcon as TelegramIconGlyph } from "@phosphor-icons/react/dist/ssr/TelegramLogo";
import { WhatsappLogoIcon as WhatsAppIconGlyph } from "@phosphor-icons/react/dist/ssr/WhatsappLogo";

/**
 * RadioKlad storefront icons. Context-free, per-icon imports work in both
 * server and client components without pulling in the full icon catalogue.
 * Duotone is used for subjects/actions; bold for compact navigation controls.
 * Existing event handlers, labels and layout classes stay at the call site.
 */
function storefrontIcon(Glyph: Icon, defaultWeight: IconWeight = "duotone") {
  return function StorefrontIcon({ className, weight = defaultWeight, ...props }: IconProps) {
    const labelled = Boolean(props.alt || props["aria-label"] || props["aria-labelledby"]);
    return (
      <Glyph
        size={24}
        weight={weight}
        aria-hidden={labelled ? undefined : true}
        role={labelled ? "img" : undefined}
        focusable="false"
        {...props}
        className={["rk-icon", className].filter(Boolean).join(" ")}
        data-icon-set="phosphor"
      />
    );
  };
}

export const AlertCircle = /*#__PURE__*/ storefrontIcon(AlertCircleGlyph);
export const AlertTriangle = /*#__PURE__*/ storefrontIcon(AlertTriangleGlyph);
export const AlignJustify = /*#__PURE__*/ storefrontIcon(AlignJustifyGlyph, "bold");
export const ArrowDown = /*#__PURE__*/ storefrontIcon(ArrowDownGlyph, "bold");
export const ArrowLeft = /*#__PURE__*/ storefrontIcon(ArrowLeftGlyph, "bold");
export const ArrowRight = /*#__PURE__*/ storefrontIcon(ArrowRightGlyph, "bold");
export const Banknote = /*#__PURE__*/ storefrontIcon(BanknoteGlyph);
export const BookOpen = /*#__PURE__*/ storefrontIcon(BookOpenGlyph);
export const Cable = /*#__PURE__*/ storefrontIcon(CableGlyph);
export const Calculator = /*#__PURE__*/ storefrontIcon(CalculatorGlyph);
export const CheckCircle = /*#__PURE__*/ storefrontIcon(CheckCircleGlyph);
export const ChevronLeft = /*#__PURE__*/ storefrontIcon(ChevronLeftGlyph, "bold");
export const ChevronRight = /*#__PURE__*/ storefrontIcon(ChevronRightGlyph, "bold");
export const CircuitBoard = /*#__PURE__*/ storefrontIcon(CircuitBoardGlyph);
export const ClipboardList = /*#__PURE__*/ storefrontIcon(ClipboardListGlyph);
export const Clock = /*#__PURE__*/ storefrontIcon(ClockGlyph);
export const Cpu = /*#__PURE__*/ storefrontIcon(CpuGlyph);
export const Disc = /*#__PURE__*/ storefrontIcon(DiscGlyph);
export const ExternalLink = /*#__PURE__*/ storefrontIcon(ExternalLinkGlyph, "bold");
export const HardDrive = /*#__PURE__*/ storefrontIcon(HardDriveGlyph);
export const Home = /*#__PURE__*/ storefrontIcon(HomeGlyph);
export const Info = /*#__PURE__*/ storefrontIcon(InfoGlyph);
export const Loader2 = /*#__PURE__*/ storefrontIcon(Loader2Glyph, "bold");
export const Mail = /*#__PURE__*/ storefrontIcon(MailGlyph);
export const MapPin = /*#__PURE__*/ storefrontIcon(MapPinGlyph);
export const MapPinned = /*#__PURE__*/ storefrontIcon(MapPinnedGlyph);
export const Menu = /*#__PURE__*/ storefrontIcon(MenuGlyph, "bold");
export const MessageCircle = /*#__PURE__*/ storefrontIcon(MessageCircleGlyph);
export const MessageSquare = /*#__PURE__*/ storefrontIcon(MessageSquareGlyph);
export const Minus = /*#__PURE__*/ storefrontIcon(MinusGlyph, "bold");
export const Package = /*#__PURE__*/ storefrontIcon(PackageGlyph);
export const Pencil = /*#__PURE__*/ storefrontIcon(PencilGlyph);
export const Phone = /*#__PURE__*/ storefrontIcon(PhoneGlyph);
export const Plus = /*#__PURE__*/ storefrontIcon(PlusGlyph, "bold");
export const Printer = /*#__PURE__*/ storefrontIcon(PrinterGlyph);
export const Quote = /*#__PURE__*/ storefrontIcon(QuoteGlyph);
export const Radio = /*#__PURE__*/ storefrontIcon(RadioGlyph);
export const RotateCcw = /*#__PURE__*/ storefrontIcon(RotateCcwGlyph, "bold");
export const Scale = /*#__PURE__*/ storefrontIcon(ScaleGlyph);
export const Search = /*#__PURE__*/ storefrontIcon(SearchGlyph);
export const Send = /*#__PURE__*/ storefrontIcon(SendGlyph);
export const Settings = /*#__PURE__*/ storefrontIcon(SettingsGlyph);
export const Shield = /*#__PURE__*/ storefrontIcon(ShieldGlyph);
export const Sparkles = /*#__PURE__*/ storefrontIcon(SparklesGlyph);
export const Star = /*#__PURE__*/ storefrontIcon(StarGlyph, "fill");
export const Trash2 = /*#__PURE__*/ storefrontIcon(Trash2Glyph);
export const TrendingUp = /*#__PURE__*/ storefrontIcon(TrendingUpGlyph);
export const Truck = /*#__PURE__*/ storefrontIcon(TruckGlyph);
export const X = /*#__PURE__*/ storefrontIcon(XGlyph, "bold");
export const Zap = /*#__PURE__*/ storefrontIcon(ZapGlyph);
export const ZoomIn = /*#__PURE__*/ storefrontIcon(ZoomInGlyph);
export const ZoomOut = /*#__PURE__*/ storefrontIcon(ZoomOutGlyph);
export const TelegramIcon = /*#__PURE__*/ storefrontIcon(TelegramIconGlyph, "fill");
export const WhatsAppIcon = /*#__PURE__*/ storefrontIcon(WhatsAppIconGlyph, "fill");
