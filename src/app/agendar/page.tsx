import { BookingStepper } from "@/features/booking/components/stepper";
import { getActiveServices, getBlockedDatesForCalendar } from "@/features/booking/queries";
import { getStudioInfo } from "@/features/landing/queries";

export const dynamic = "force-dynamic";

export default async function AgendarPage() {
  const [studio, services, blockedDates] = await Promise.all([
    getStudioInfo(),
    getActiveServices(),
    getBlockedDatesForCalendar(),
  ]);

  return (
    <div className="mx-auto min-h-screen w-full max-w-[440px] bg-background">
      <BookingStepper studioName={studio.name} services={services} blockedDates={blockedDates} />
    </div>
  );
}
