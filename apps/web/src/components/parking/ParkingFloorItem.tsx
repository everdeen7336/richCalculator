import { ParkingFloor, ParkingStatus, PARKING_STATUS_META } from '@/types';

interface ParkingFloorItemProps {
  floor: ParkingFloor;
}

export function ParkingFloorItem({ floor }: ParkingFloorItemProps) {
  const statusMeta = PARKING_STATUS_META[floor.status];
  const isFull = floor.status === ParkingStatus.FULL;

  return (
    <div
      className={`
        flex items-center justify-between p-3 rounded-lg
        ${isFull ? 'bg-red-50' : 'bg-gray-50'}
      `}
    >
      <span className="font-medium text-gray-700">{floor.floorName}</span>
      <div className="flex items-center gap-2">
        {isFull ? (
          <span className="px-2 py-1 text-xs font-bold rounded" style={{ backgroundColor: `${statusMeta.color}20`, color: statusMeta.color }}>
            {statusMeta.labelKo}
          </span>
        ) : floor.availableSpaces !== null ? (
          <span className="font-bold" style={{ color: statusMeta.color }}>
            {floor.availableSpaces}대 가능
          </span>
        ) : (
          <span className="text-gray-400">-</span>
        )}
      </div>
    </div>
  );
}
