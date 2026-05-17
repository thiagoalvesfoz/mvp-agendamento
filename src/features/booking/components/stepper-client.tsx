"use client";

import dynamic from "next/dynamic";
import { BookingStepperSkeleton } from "./stepper-skeleton";
import type { ServiceForBooking } from "../queries";
import type { BlockedDateEntry } from "./calendar-picker";

const BookingStepper = dynamic(
  () => import("./stepper").then((m) => ({ default: m.BookingStepper })),
  { loading: () => <BookingStepperSkeleton />, ssr: false },
);

interface Props {
  studioName: string;
  services: ServiceForBooking[];
  blockedDates: BlockedDateEntry[];
  minNoticeHours: number;
  maxDaysAhead: number;
}

export function BookingStepperClient(props: Props) {
  return <BookingStepper {...props} />;
}
