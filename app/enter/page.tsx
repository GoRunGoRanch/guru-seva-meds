import { EnterForm } from "./enter-form";

export const dynamic = "force-dynamic";

export default function EnterPage({
  searchParams,
}: {
  searchParams: { next?: string };
}) {
  return <EnterForm next={searchParams.next || "/dashboard"} />;
}
