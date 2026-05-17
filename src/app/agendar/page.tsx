import { BookingStepper } from "@/features/booking/components/stepper";
import { getActiveServices, getBlockedDatesForCalendar } from "@/features/booking/queries";
import { getStudioInfo } from "@/features/landing/queries";
import { getSettings } from "@/features/settings/queries";

export const dynamic = "force-dynamic";

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
