import { HugeiconsIcon, type HugeiconsIconProps, type IconSvgElement } from "@hugeicons/react";
import {
  ArrowLeft02Icon as HugeArrowLeftIcon,
  ArrowRight01Icon as HugeArrowRightIcon,
  Attachment02Icon as HugeAttachmentIcon,
  BrainCircuitIcon as HugeBrainCircuitIcon,
  BookOpen02Icon as HugeBookOpenIcon,
  BubbleChatIcon as HugeBubbleChatIcon,
  Calendar03Icon as HugeCalendarIcon,
  Cancel01Icon as HugeCancelIcon,
  CheckIcon as HugeCheckIcon,
  CheckmarkBadge03Icon as HugeCheckBadgeIcon,
  CheckmarkCircle01Icon as HugeCheckCircleIcon,
  ChevronDownIcon as HugeChevronDownIcon,
  ChevronLeftIcon as HugeChevronLeftIcon,
  ChevronRightIcon as HugeChevronRightIcon,
  ChevronUpIcon as HugeChevronUpIcon,
  Chat01Icon as HugeChatIcon,
  Clock01Icon as HugeClockIcon,
  CreditCardIcon as HugeCreditCardIcon,
  DangerIcon as HugeDangerIcon,
  DashboardSquare01Icon as HugeDashboardSquareIcon,
  Delete01Icon as HugeDeleteIcon,
  Download03Icon as HugeDownloadIcon,
  Edit02Icon as HugeEditIcon,
  EyeIcon as HugeEyeIcon,
  EyeOffIcon as HugeEyeOffIcon,
  FileTextIcon as HugeFileTextIcon,
  FileUploadIcon as HugeFileUploadIcon,
  Flowchart01Icon as HugeFlowchartIcon,
  Folder01Icon as HugeFolderIcon,
  Grid02Icon as HugeGridIcon,
  GoogleIcon as HugeGoogleIcon,
  Home01Icon as HugeHomeIcon,
  IdeaIcon as HugeIdeaIcon,
  Image02Icon as HugeImageIcon,
  InboxIcon as HugeInboxIcon,
  ItalicIcon as HugeItalicIcon,
  LifebuoyIcon as HugeLifebuoyIcon,
  LinkIcon as HugeLinkIcon,
  ListIcon as HugeListIcon,
  ListOrderedIcon as HugeListOrderedIcon,
  Loading03Icon as HugeLoadingIcon,
  LockIcon as HugeLockIcon,
  Logout03Icon as HugeLogoutIcon,
  Mail02Icon as HugeMailIcon,
  Menu01Icon as HugeMenuIcon,
  MoonIcon as HugeMoonIcon,
  PeriscopeIcon as HugePeriscopeIcon,
  PlayCircleIcon as HugePlayCircleIcon,
  PlusSignIcon as HugePlusIcon,
  PresentationPodiumIcon as HugePresentationPodiumIcon,
  PuzzleIcon as HugePuzzleIcon,
  Rocket02Icon as HugeRocketIcon,
  ScaleIcon as HugeScaleIcon,
  SchoolIcon as HugeSchoolIcon,
  SecurityCheckIcon as HugeSecurityCheckIcon,
  Settings02Icon as HugeSettingsIcon,
  SparklesIcon as HugeSparklesIcon,
  StarIcon as HugeStarIcon,
  Sun02Icon as HugeSunIcon,
  SwatchIcon as HugeSwatchIcon,
  TextBoldIcon as HugeBoldIcon,
  Upload01Icon as HugeUploadIcon,
  UserCircleIcon as HugeUserCircleIcon,
  UserGroup02Icon as HugeUserGroupIcon,
  UserIcon as HugeUserIcon,
  UserPlusIcon as HugeUserPlusIcon,
  UsersIcon as HugeUsersIcon,
  ZapIcon as HugeBoltIcon,
} from "@hugeicons/core-free-icons";

type AppIconProps = Omit<HugeiconsIconProps, "icon">;

function createIcon(icon: IconSvgElement, displayName: string) {
  const Component = ({ strokeWidth = 1.7, ...props }: AppIconProps) => (
    <HugeiconsIcon icon={icon} strokeWidth={strokeWidth} {...props} />
  );

  Component.displayName = displayName;
  return Component;
}

export const AcademicCapIcon = createIcon(HugeSchoolIcon, "AcademicCapIcon");
export const ArrowDownTrayIcon = createIcon(HugeDownloadIcon, "ArrowDownTrayIcon");
export const ArrowLeftIcon = createIcon(HugeArrowLeftIcon, "ArrowLeftIcon");
export const ArrowPathIcon = createIcon(HugeLoadingIcon, "ArrowPathIcon");
export const ArrowRightIcon = createIcon(HugeArrowRightIcon, "ArrowRightIcon");
export const ArrowRightStartOnRectangleIcon = createIcon(HugeLogoutIcon, "ArrowRightStartOnRectangleIcon");
export const ArrowUpTrayIcon = createIcon(HugeUploadIcon, "ArrowUpTrayIcon");
export const BoldIcon = createIcon(HugeBoldIcon, "BoldIcon");
export const BoltIcon = createIcon(HugeBoltIcon, "BoltIcon");
export const BookOpenIcon = createIcon(HugeBookOpenIcon, "BookOpenIcon");
export const CalendarDaysIcon = createIcon(HugeCalendarIcon, "CalendarDaysIcon");
export const CalendarIcon = createIcon(HugeCalendarIcon, "CalendarIcon");
export const ChatBubbleLeftIcon = createIcon(HugeChatIcon, "ChatBubbleLeftIcon");
export const ChatBubbleLeftRightIcon = createIcon(HugeBubbleChatIcon, "ChatBubbleLeftRightIcon");
export const CheckBadgeIcon = createIcon(HugeCheckBadgeIcon, "CheckBadgeIcon");
export const CheckCircleIcon = createIcon(HugeCheckCircleIcon, "CheckCircleIcon");
export const CheckIcon = createIcon(HugeCheckIcon, "CheckIcon");
export const ChevronDownIcon = createIcon(HugeChevronDownIcon, "ChevronDownIcon");
export const ChevronLeftIcon = createIcon(HugeChevronLeftIcon, "ChevronLeftIcon");
export const ChevronRightIcon = createIcon(HugeChevronRightIcon, "ChevronRightIcon");
export const ChevronUpIcon = createIcon(HugeChevronUpIcon, "ChevronUpIcon");
export const ClockIcon = createIcon(HugeClockIcon, "ClockIcon");
export const Cog6ToothIcon = createIcon(HugeSettingsIcon, "Cog6ToothIcon");
export const CreditCardIcon = createIcon(HugeCreditCardIcon, "CreditCardIcon");
export const DocumentArrowUpIcon = createIcon(HugeFileUploadIcon, "DocumentArrowUpIcon");
export const DocumentTextIcon = createIcon(HugeFileTextIcon, "DocumentTextIcon");
export const DecisionPsychologyIcon = createIcon(HugeBrainCircuitIcon, "DecisionPsychologyIcon");
export const EnvelopeIcon = createIcon(HugeMailIcon, "EnvelopeIcon");
export const ExclamationTriangleIcon = createIcon(HugeDangerIcon, "ExclamationTriangleIcon");
export const EyeIcon = createIcon(HugeEyeIcon, "EyeIcon");
export const EyeSlashIcon = createIcon(HugeEyeOffIcon, "EyeSlashIcon");
export const FolderIcon = createIcon(HugeFolderIcon, "FolderIcon");
export const GoogleIcon = createIcon(HugeGoogleIcon, "GoogleIcon");
export const HomeIcon = createIcon(HugeHomeIcon, "HomeIcon");
export const InboxIcon = createIcon(HugeInboxIcon, "InboxIcon");
export const ItalicIcon = createIcon(HugeItalicIcon, "ItalicIcon");
export const LifebuoyIcon = createIcon(HugeLifebuoyIcon, "LifebuoyIcon");
export const LightBulbIcon = createIcon(HugeIdeaIcon, "LightBulbIcon");
export const LinkIcon = createIcon(HugeLinkIcon, "LinkIcon");
export const ListBulletIcon = createIcon(HugeListIcon, "ListBulletIcon");
export const LockClosedIcon = createIcon(HugeLockIcon, "LockClosedIcon");
export const MenuIcon = createIcon(HugeMenuIcon, "MenuIcon");
export const MoonIcon = createIcon(HugeMoonIcon, "MoonIcon");
export const NumberedListIcon = createIcon(HugeListOrderedIcon, "NumberedListIcon");
export const PaperClipIcon = createIcon(HugeAttachmentIcon, "PaperClipIcon");
export const PencilSquareIcon = createIcon(HugeEditIcon, "PencilSquareIcon");
export const PhotoIcon = createIcon(HugeImageIcon, "PhotoIcon");
export const PlayCircleIcon = createIcon(HugePlayCircleIcon, "PlayCircleIcon");
export const PlusIcon = createIcon(HugePlusIcon, "PlusIcon");
export const ProfessionalPowerIcon = createIcon(HugePresentationPodiumIcon, "ProfessionalPowerIcon");
export const PuzzlePieceIcon = createIcon(HugePuzzleIcon, "PuzzlePieceIcon");
export const RectangleGroupIcon = createIcon(HugeDashboardSquareIcon, "RectangleGroupIcon");
export const RocketLaunchIcon = createIcon(HugeRocketIcon, "RocketLaunchIcon");
export const ScaleIcon = createIcon(HugeScaleIcon, "ScaleIcon");
export const ShieldCheckIcon = createIcon(HugeSecurityCheckIcon, "ShieldCheckIcon");
export const SparklesIcon = createIcon(HugeSparklesIcon, "SparklesIcon");
export const Squares2X2Icon = createIcon(HugeGridIcon, "Squares2X2Icon");
export const StarIcon = createIcon(HugeStarIcon, "StarIcon");
export const StethoscopeIcon = createIcon(HugePeriscopeIcon, "StethoscopeIcon");
export const StoryArchitectureIcon = createIcon(HugeFlowchartIcon, "StoryArchitectureIcon");
export const SunIcon = createIcon(HugeSunIcon, "SunIcon");
export const SwatchIcon = createIcon(HugeSwatchIcon, "SwatchIcon");
export const TrashIcon = createIcon(HugeDeleteIcon, "TrashIcon");
export const UserCircleIcon = createIcon(HugeUserCircleIcon, "UserCircleIcon");
export const UserGroupIcon = createIcon(HugeUserGroupIcon, "UserGroupIcon");
export const UserIcon = createIcon(HugeUserIcon, "UserIcon");
export const UserPlusIcon = createIcon(HugeUserPlusIcon, "UserPlusIcon");
export const UsersIcon = createIcon(HugeUsersIcon, "UsersIcon");
export const XMarkIcon = createIcon(HugeCancelIcon, "XMarkIcon");
