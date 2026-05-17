import dynamic from "next/dynamic";
import { getActiveServices, getBlockedDatesForCalendar } from "@/features/booking/queries";
import { getStudioInfo } from "@/features/landing/queries";
import { getSettings } from "@/features/settings/queries";
import { BookingStepperSkeleton } from "@/features/booking/components/stepper-skeleton";

export const revalidate = 300;

const BookingStepper = dynamic(
  () =>
    import("@/features/booking/components/stepper").then((m) => ({ default: m.BookingStepper })),
  { loading: () => <BookingStepperSkeleton />, ssr: false },
);

export default async function AgendarPage() {
  const [studio, services, blockedDates, settings] = await Promise.all([
    getStudioInfo(),
    getActiveServices(),
    getBlockedDatesForCalendar(),
    getSettings(),
  ]);

  return (
    <div className="mx-auto min-h-screen w-full max-w-[440px] bg-background">
      <BookingStepper
        studioName={studio.name}
        services={services}
        blockedDates={blockedDates}
        minNoticeHours={settings.minimumScheduleNoticeHours}
        maxDaysAhead={settings.maximumScheduleDaysAhead}
      />
    </div>
  );
}
