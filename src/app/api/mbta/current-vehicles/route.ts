import { auth } from '@/app/auth';
import requestMbta from '@/lib/mbta/request';
import { MBTAAPIVehicle } from '@/lib/types/mbta';
import { User } from '@/lib/types/user';
import { NextResponse } from 'next/server';

export async function GET() {
  // Check for authenticated user
  const session = await auth();
  if (!session?.user || !session.user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const user = session.user as User;

  // Get current commuter rail vehicles
  // Filters:
  // - route type is commuter rail
  const vehicles = (await requestMbta(
    `/vehicles?filter[route_type]=2&filter[revenue]=REVENUE`,
    user,
  )) as (MBTAAPIVehicle & { name: string })[];

  await Promise.all(
    vehicles.map(async (train) => {
      // Get train trip name
      const tripId = train.relationships?.trip.data.id;
      const tripReq = await requestMbta(`/trips/${tripId}`, user);
      train.name = tripReq.attributes.name || train.id;
    }),
  );

  return NextResponse.json(
    vehicles.map((vehicle) => ({
      id: vehicle.id,
      name: vehicle.name,
      ...vehicle.attributes,
    })),
  );
}
