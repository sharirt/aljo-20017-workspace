import { useState } from "react";
import { useUser } from "@blocksdiy/blocks-client-sdk/reactSdk";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  BookOpen,
  Shield,
  User,
  Building2,
  ChevronDown,
  UserPlus,
  FileCheck,
  CheckCircle,
  Wallet,
  Receipt,
  LogIn,
  ClipboardList,
  GraduationCap,
  CalendarCheck,
  Clock,
  MapPin,
  PlusCircle,
  FileText,
  MessageCircle,
  Lightbulb,
} from "lucide-react";
import { WalkthroughSection } from "@/components/WalkthroughSection";

const adminSections = [
  {
    title: "Invite Staff onto the App",
    icon: UserPlus,
    steps: [
      'Go to the top-right corner of the screen and click "Invite & Share".',
      'Click "Publish" and set the app to "Private".',
      'Choose "Only invited users can login".',
      'Enter the staff member\'s email address and click "Invite".',
      "The staff member will receive an email with a link to sign in.",
      'After they sign in, go to "Team" in the left menu to set their role to "staff".',
    ],
    tip: "You can invite many staff members at once. Just repeat the invite step for each person.",
  },
  {
    title: "Create a Facility & Facility Manager Profile",
    icon: Building2,
    steps: [
      'Click "Facility Management" in the left menu.',
      'Click the "Add Facility" button at the top right.',
      "Fill in the facility name, city, province, address, and contact information.",
      'Click "Save" to create the facility.',
      "Click on the facility you just created to select it.",
      'Scroll down to find the "Manage Logins" section.',
      'Click "Add Facility Manager" and enter the manager\'s email address.',
      "The manager will now be linked to this facility.",
    ],
    tip: "Make sure the facility address is correct — it is used for the geofence feature when staff clock in.",
  },
  {
    title: "Review Staff Documents",
    icon: FileCheck,
    steps: [
      'Click "Staff Management" in the left menu.',
      "Find the staff member you want to review. You can search by name or email.",
      "Click on the staff member's card to open their profile.",
      'Scroll down to the "Documents" section.',
      "For each document, click the eye icon to view it.",
      'Click "Approve" if the document looks correct.',
      'Click "Reject" if there is a problem — you must write a reason.',
      "The staff member will be notified of your decision.",
    ],
    tip: "Check the expiry date on each document. Expired documents will need to be re-uploaded by the staff member.",
  },
  {
    title: "Approve Staff Onboarding",
    icon: CheckCircle,
    steps: [
      'Click "Staff Management" in the left menu.',
      'Click the "Pending Onboarding" tab at the top.',
      "Find the staff member who is ready for approval.",
      "Click on their card to open their full profile.",
      "Review their documents and profile information.",
      'Scroll to the bottom and click "Approve Onboarding".',
      "The staff member can now claim shifts.",
    ],
    tip: "Only approve onboarding after all required documents have been reviewed and approved.",
  },
  {
    title: "Generate Payroll for Staff",
    icon: Wallet,
    steps: [
      'Click "Payroll" in the left menu.',
      'Click the "Generate Payroll" button at the top right.',
      "A dialog will open showing three pay periods: Previous, Current, and Next.",
      "Click on the pay period you want to generate payroll for.",
      "Read the period dates carefully to make sure you selected the right one.",
      "If you see a yellow warning, payroll was already generated for this period.",
      'Click "Generate" to create the payroll records.',
      "The timesheets will appear in the list below.",
    ],
    tip: "Generate payroll at the end of each pay period so staff can see their earnings.",
  },
  {
    title: "Generate Invoices for Facilities",
    icon: Receipt,
    steps: [
      'Click "Payroll" in the left menu.',
      "Find the facility group in the payroll list.",
      'Click "Generate Invoice" next to the facility.',
      "Review the line items and total amount.",
      'Click "Confirm" to create the invoice.',
      'Go to "Invoices" in the left menu to see all invoices.',
      'Click "Mark as Sent" when you have sent the invoice to the facility.',
      'Click "Mark as Paid" when the facility has paid.',
    ],
    tip: "Always review invoice line items before sending. You can download the invoice as a PDF.",
  },
];

const staffSections = [
  {
    title: "Sign In to the App",
    icon: LogIn,
    steps: [
      "Open the app link in your web browser on your phone or computer.",
      "Enter your email address in the box.",
      'Click "Send Login Link".',
      "Open your email inbox and find the email from ALJO CareCrew.",
      "Click the link inside the email. You are now signed in!",
      "Tip: You can also sign in with Google if you have a Google account.",
    ],
    tip: "Check your spam or junk folder if you do not see the login email.",
  },
  {
    title: "Complete the Onboarding Process",
    icon: ClipboardList,
    steps: [
      "After signing in, you will see an onboarding checklist on your dashboard.",
      "Step 1 — Fill in your profile: Add your name, phone number, date of birth, role type, and emergency contact.",
      'Step 2 — Upload your documents: Go to "My Documents" and upload each required document (e.g. nursing license, CPR card, government ID).',
      "Step 3 — Sign your contract: You will receive a contract by email. Click the link and sign it electronically.",
      "Step 4 — Wait for approval: An admin will review your documents and approve your account.",
      "Once approved, you can start claiming shifts!",
    ],
    tip: "Make sure your documents are clear and easy to read. Blurry photos may be rejected.",
  },
  {
    title: "Go Through Orientation",
    icon: GraduationCap,
    steps: [
      "Before working at a new facility, you may need an orientation.",
      'Go to "Available Shifts" and find a shift at the facility you want to work at.',
      'If orientation is required, you will see an "Orientation Required" message.',
      'Click "Request Orientation" to send a request to the facility manager.',
      "The facility manager will schedule your orientation and notify you.",
      "Attend the orientation on the scheduled date.",
      "After the orientation is marked complete, you can claim shifts at that facility.",
    ],
    tip: "Orientation only needs to be done once per facility. After that, you can claim shifts freely.",
  },
  {
    title: "Sign onto Shifts at the Facility",
    icon: CalendarCheck,
    steps: [
      'Click "Available Shifts" in the bottom menu.',
      "Browse the list of open shifts. You can filter by date or city.",
      "Click on a shift to see the details: facility, date, time, role, and pay rate.",
      'If you are eligible, click "Claim Shift".',
      'The shift will appear in "My Shifts" once it is confirmed.',
      "Tip: Make sure your compliance documents are approved before claiming shifts.",
    ],
    tip: "Claim shifts early — popular shifts fill up fast!",
  },
  {
    title: "Clock In and Out of Shifts",
    icon: Clock,
    steps: [
      "On the day of your shift, open the app on your phone.",
      'Go to "My Shifts" in the bottom menu.',
      'Find your upcoming shift. A "Clock In" button will appear 15 minutes before the shift starts.',
      'Click "Clock In" when you arrive at the facility.',
      'When your shift is finished, click "Clock Out".',
      "Your hours will be automatically calculated and saved.",
      "Tip: Make sure your phone's location is turned on before clocking in.",
    ],
    tip: "If you forget to clock out, contact your ALJO administrator as soon as possible.",
  },
  {
    title: "Use the Geofence Feature",
    icon: MapPin,
    steps: [
      "The geofence is an invisible boundary around the facility.",
      "When you clock in, the app checks if you are inside this boundary.",
      'If you are inside the boundary, you will see a green "Inside" badge. This is good!',
      'If you are outside the boundary, you will see an orange "Outside" badge. The app will ask you to confirm.',
      "If you are blocked from clocking in, move closer to the facility entrance and try again.",
      'Tip: Make sure your phone\'s GPS / location permission is set to "Always" or "While Using App".',
      "If you have a problem, contact your ALJO administrator.",
    ],
    tip: 'Open the app\'s location settings on your phone and set it to "Always Allow" for the best experience.',
  },
];

const fmSections = [
  {
    title: "Sign In to the App",
    icon: LogIn,
    steps: [
      "Open the app link in your web browser on your phone or computer.",
      "Enter your email address in the box.",
      'Click "Send Login Link".',
      "Open your email inbox and find the email from ALJO CareCrew.",
      "Click the link inside the email. You are now signed in!",
      "You will be taken to your Facility Dashboard automatically.",
    ],
    tip: "Bookmark the app link on your phone for quick access.",
  },
  {
    title: "Go Through the Orientation Process",
    icon: GraduationCap,
    steps: [
      "When a staff member requests an orientation at your facility, you will receive a notification.",
      'Go to your Facility Dashboard and find the "Orientation Requests" section.',
      'Click "Schedule" next to the staff member\'s name.',
      'Choose a date and time for the orientation and click "Confirm".',
      "The staff member will be notified of the scheduled date.",
      "On the day of the orientation, conduct the session with the staff member.",
      'After the orientation is done, go back to the dashboard and click "Mark Complete".',
      "The staff member can now work shifts at your facility.",
    ],
    tip: "Try to schedule orientations within a few days of the request so staff can start working sooner.",
  },
  {
    title: "Post a Shift on the App",
    icon: PlusCircle,
    steps: [
      'Click "Post a Shift" in the left menu.',
      'Choose "Single Shift" to post one shift, or "Bulk Post" to post many shifts at once.',
      "Select the role needed (e.g. RN, LPN, CCA).",
      "Choose the date and start/end time of the shift.",
      "Set the number of staff needed (headcount).",
      'If orientation is required for this shift, turn on the "Requires Orientation" toggle.',
      'Click "Post Shift" to publish it. Staff can now see and claim this shift.',
    ],
    tip: "Post shifts at least 24 hours ahead so more staff can see and apply for them.",
  },
  {
    title: "View Invoices",
    icon: FileText,
    steps: [
      'Click "Invoices" in the left menu.',
      "You will see a list of all invoices for your facility.",
      "Each invoice shows the billing period, total amount, and payment status.",
      "Click on an invoice to see the full breakdown of shifts and charges.",
      "If you have a question about an invoice, contact your ALJO administrator.",
    ],
    tip: "Check your invoices regularly to stay on top of billing.",
  },
  {
    title: "Use In-Platform Chat to Message Staff",
    icon: MessageCircle,
    steps: [
      'Click "Messages" in the left menu.',
      "You will see your message inbox.",
      'To send a message to one staff member, click "New Message", search for their name, and type your message.',
      'To send a message to all staff at your facility, click "Broadcast" and type your message.',
      'Click "Send" when you are ready.',
      "Staff will receive your message in their Messages inbox.",
    ],
    tip: "Use broadcast messages for important announcements that all staff need to see.",
  },
];

export default function Walkthrough() {
  const user = useUser();

  const defaultTab =
    user.role === "staff"
      ? "staff"
      : user.role === "facility_manager"
        ? "facility_manager"
        : "admin";

  return (
    <div className="mx-auto max-w-3xl p-4 md:p-6">
      {/* Welcome Banner */}
      <Card className="mb-6 overflow-hidden border-0 bg-gradient-to-r from-primary/10 to-accent/10">
        <CardContent className="flex items-center gap-4 p-6">
          <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary/15">
            <BookOpen className="size-7 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Welcome to ALJO CareCrew 👋
            </h1>
            <p className="mt-1 text-base text-muted-foreground">
              This guide will help you get started. Choose your role below.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Role Tabs */}
      <Tabs defaultValue={defaultTab}>
        <TabsList className="mb-6 grid w-full grid-cols-3">
          <TabsTrigger value="admin" className="min-h-[44px] gap-2 text-sm">
            <Shield className="size-4" />
            <span>Admin</span>
          </TabsTrigger>
          <TabsTrigger value="staff" className="min-h-[44px] gap-2 text-sm">
            <User className="size-4" />
            <span>Staff</span>
          </TabsTrigger>
          <TabsTrigger
            value="facility_manager"
            className="min-h-[44px] gap-2 text-sm"
          >
            <Building2 className="size-4" />
            <span className="hidden sm:inline">Facility Manager</span>
            <span className="sm:hidden">Facility</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="admin">
          <div className="flex flex-col gap-4">
            {adminSections.map((section, i) => (
              <WalkthroughSection
                key={i}
                title={section.title}
                icon={section.icon}
                steps={section.steps}
                tip={section.tip}
                accentClass="text-primary"
                badgeClass="bg-primary text-primary-foreground"
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="staff">
          <div className="flex flex-col gap-4">
            {staffSections.map((section, i) => (
              <WalkthroughSection
                key={i}
                title={section.title}
                icon={section.icon}
                steps={section.steps}
                tip={section.tip}
                accentClass="text-accent-foreground"
                badgeClass="bg-accent text-accent-foreground"
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="facility_manager">
          <div className="flex flex-col gap-4">
            {fmSections.map((section, i) => (
              <WalkthroughSection
                key={i}
                title={section.title}
                icon={section.icon}
                steps={section.steps}
                tip={section.tip}
                accentClass="text-chart-4"
                badgeClass="bg-chart-4 text-primary-foreground"
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}