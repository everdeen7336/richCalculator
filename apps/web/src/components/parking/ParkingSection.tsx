import { ParkingFloor, ParkingTower, ParkingStatus, PARKING_STATUS_META } from '@/types';
import { ParkingFloorItem } from './ParkingFloorItem';

interface ParkingSectionProps {
  title: string;
  color: 'blue' | 'green';
  floors?: ParkingFloor[];
  towers?: ParkingTower[];
  totalAvailable: number;
  hasFull: boolean;
  unavailable?: boolean;
}

const colorClasses = {
  blue: 'bg-blue-500',
  green: 'bg-green-500',
};

const textColorClasses = {
  blue: 'text-blue-600',
  green: 'text-green-600',
};

export function ParkingSection({
  title,
  color,
  floors,
  towers,
  totalAvailable,
  hasFull,
  unavailable,
}: ParkingSectionProps) {
  // 타워를 Floor 형태로 변환
  const items: ParkingFloor[] = towers
    ? towers.map((tower) => ({
        floorId: tower.towerId,
        floorName: tower.towerName,
        status: tower.status,
        availableSpaces: tower.availableSpaces,
        rawText: tower.rawText,
      }))
    : floors || [];

  return (
    <div>
      <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
        <span className={`w-3 h-3 rounded-full ${colorClasses[color]}`} />
        {title}
      </h3>

      <div className="space-y-2">
        {unavailable ? (
          <div className="text-gray-400 text-sm py-6 text-center bg-gray-50 rounded-lg">
            실시간 현황 정보 미제공
          </div>
        ) : items.length > 0 ? (
          items.map((item) => (
            <ParkingFloorItem key={item.floorId} floor={item} />
          ))
        ) : (
          <div className="text-gray-400 text-sm py-4 text-center">
            정보를 불러오는 중...
          </div>
        )}
      </div>

      {!unavailable && (
        <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between items-center">
          <span className="text-sm text-gray-500">총 가용</span>
          <span className={`font-bold ${textColorClasses[color]}`}>
            {totalAvailable > 0 ? `${totalAvailable}대` : '-'}
          </span>
        </div>
      )}
    </div>
  );
}
