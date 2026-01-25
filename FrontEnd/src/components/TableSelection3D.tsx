import { useRef, useState, Suspense } from 'react';
import { Canvas, useFrame, ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Text, PerspectiveCamera, Environment } from '@react-three/drei';
import * as THREE from 'three';

interface TableProps {
  position: [number, number, number];
  tableNumber: number;
  seats: number;
  isSelected: boolean;
  isAvailable: boolean;
  onClick: () => void;
}

const Table = ({ position, tableNumber, seats, isSelected, isAvailable, onClick }: TableProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (groupRef.current) {
      // Subtle floating animation for selected table
      if (isSelected) {
        groupRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.05;
      } else {
        groupRef.current.position.y = position[1];
      }
    }
  });

  const tableColor = isSelected 
    ? '#f59e0b' // amber/primary
    : isAvailable 
      ? (hovered ? '#fbbf24' : '#78716c') // hover: lighter, default: stone
      : '#dc2626'; // red for unavailable

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (isAvailable) {
      onClick();
    }
  };

  // Table dimensions based on seats
  const tableRadius = seats <= 2 ? 0.4 : seats <= 4 ? 0.55 : 0.7;
  const tableHeight = 0.08;

  return (
    <group 
      ref={groupRef} 
      position={position}
      onClick={handleClick}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = isAvailable ? 'pointer' : 'not-allowed'; }}
      onPointerOut={() => { setHovered(false); document.body.style.cursor = 'auto'; }}
    >
      {/* Table top */}
      <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[tableRadius, tableRadius, tableHeight, 32]} />
        <meshStandardMaterial 
          color={tableColor} 
          metalness={0.3} 
          roughness={0.6}
          emissive={isSelected ? '#f59e0b' : '#000000'}
          emissiveIntensity={isSelected ? 0.2 : 0}
        />
      </mesh>

      {/* Table leg */}
      <mesh position={[0, 0.22, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.08, 0.44, 16]} />
        <meshStandardMaterial color="#44403c" metalness={0.5} roughness={0.4} />
      </mesh>

      {/* Table base */}
      <mesh position={[0, 0.02, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.25, 0.25, 0.04, 32]} />
        <meshStandardMaterial color="#44403c" metalness={0.5} roughness={0.4} />
      </mesh>

      {/* Chairs */}
      {Array.from({ length: seats }).map((_, i) => {
        const angle = (i / seats) * Math.PI * 2;
        const chairDistance = tableRadius + 0.35;
        const chairX = Math.cos(angle) * chairDistance;
        const chairZ = Math.sin(angle) * chairDistance;
        
        return (
          <group key={i} position={[chairX, 0, chairZ]} rotation={[0, -angle + Math.PI, 0]}>
            {/* Chair seat */}
            <mesh position={[0, 0.25, 0]} castShadow>
              <boxGeometry args={[0.22, 0.04, 0.22]} />
              <meshStandardMaterial color="#78716c" metalness={0.2} roughness={0.7} />
            </mesh>
            {/* Chair back */}
            <mesh position={[0, 0.4, -0.09]} castShadow>
              <boxGeometry args={[0.2, 0.26, 0.03]} />
              <meshStandardMaterial color="#78716c" metalness={0.2} roughness={0.7} />
            </mesh>
            {/* Chair legs */}
            {[[-0.08, 0, -0.08], [0.08, 0, -0.08], [-0.08, 0, 0.08], [0.08, 0, 0.08]].map((legPos, j) => (
              <mesh key={j} position={[legPos[0], 0.12, legPos[2]]} castShadow>
                <cylinderGeometry args={[0.015, 0.015, 0.24, 8]} />
                <meshStandardMaterial color="#44403c" metalness={0.4} roughness={0.5} />
              </mesh>
            ))}
          </group>
        );
      })}

      {/* Table number label */}
      <Text
        position={[0, 0.55, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.15}
        color={isSelected ? '#ffffff' : '#1c1917'}
        anchorX="center"
        anchorY="middle"
        font="/fonts/Inter-Bold.woff"
      >
        {tableNumber}
      </Text>

      {/* Selection ring */}
      {isSelected && (
        <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[tableRadius + 0.4, tableRadius + 0.5, 32]} />
          <meshBasicMaterial color="#f59e0b" transparent opacity={0.6} />
        </mesh>
      )}
    </group>
  );
};

const Floor = () => {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
      <planeGeometry args={[12, 12]} />
      <meshStandardMaterial color="#292524" metalness={0.1} roughness={0.9} />
    </mesh>
  );
};

const RestaurantWalls = () => {
  return (
    <group>
      {/* Back wall */}
      <mesh position={[0, 1.5, -5]} receiveShadow>
        <boxGeometry args={[12, 3, 0.1]} />
        <meshStandardMaterial color="#44403c" metalness={0.1} roughness={0.8} />
      </mesh>
      {/* Side walls */}
      <mesh position={[-5.5, 1.5, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <boxGeometry args={[10, 3, 0.1]} />
        <meshStandardMaterial color="#57534e" metalness={0.1} roughness={0.8} />
      </mesh>
      <mesh position={[5.5, 1.5, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <boxGeometry args={[10, 3, 0.1]} />
        <meshStandardMaterial color="#57534e" metalness={0.1} roughness={0.8} />
      </mesh>
    </group>
  );
};

interface TableData {
  id: number;
  number: number;
  seats: number;
  position: [number, number, number];
  isAvailable: boolean;
}

interface TableSelection3DProps {
  selectedTable: number | null;
  onTableSelect: (tableNumber: number) => void;
  partySize: number;
}

const TABLES: TableData[] = [
  { id: 1, number: 1, seats: 2, position: [-3.5, 0, -3], isAvailable: true },
  { id: 2, number: 2, seats: 2, position: [-1.5, 0, -3], isAvailable: true },
  { id: 3, number: 3, seats: 4, position: [1.5, 0, -3], isAvailable: false },
  { id: 4, number: 4, seats: 4, position: [3.5, 0, -3], isAvailable: true },
  { id: 5, number: 5, seats: 4, position: [-3, 0, 0], isAvailable: true },
  { id: 6, number: 6, seats: 6, position: [0, 0, 0], isAvailable: true },
  { id: 7, number: 7, seats: 4, position: [3, 0, 0], isAvailable: true },
  { id: 8, number: 8, seats: 2, position: [-3.5, 0, 3], isAvailable: true },
  { id: 9, number: 9, seats: 8, position: [0, 0, 3], isAvailable: false },
  { id: 10, number: 10, seats: 2, position: [3.5, 0, 3], isAvailable: true },
];

const Scene = ({ selectedTable, onTableSelect, partySize }: TableSelection3DProps) => {
  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 8, 8]} fov={50} />
      <OrbitControls 
        enablePan={false}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 2.5}
        minDistance={6}
        maxDistance={14}
        target={[0, 0, 0]}
      />
      
      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight 
        position={[5, 10, 5]} 
        intensity={1} 
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={50}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />
      <pointLight position={[-3, 3, 0]} intensity={0.5} color="#fbbf24" />
      <pointLight position={[3, 3, 0]} intensity={0.5} color="#fbbf24" />
      
      {/* Environment */}
      <Floor />
      <RestaurantWalls />
      
      {/* Tables */}
      {TABLES.map((table) => (
        <Table
          key={table.id}
          position={table.position}
          tableNumber={table.number}
          seats={table.seats}
          isSelected={selectedTable === table.number}
          isAvailable={table.isAvailable && table.seats >= partySize}
          onClick={() => onTableSelect(table.number)}
        />
      ))}
    </>
  );
};

const TableSelection3D = ({ selectedTable, onTableSelect, partySize }: TableSelection3DProps) => {
  return (
    <div className="relative h-[400px] w-full overflow-hidden rounded-xl bg-stone-900">
      <Canvas shadows>
        <Suspense fallback={null}>
          <Scene 
            selectedTable={selectedTable} 
            onTableSelect={onTableSelect}
            partySize={partySize}
          />
        </Suspense>
      </Canvas>
      
      {/* Legend */}
      <div className="absolute bottom-4 left-4 flex flex-wrap gap-3 rounded-lg bg-background/90 px-4 py-2 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-amber-500" />
          <span className="text-xs text-foreground">Seçilmiş</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-stone-500" />
          <span className="text-xs text-foreground">Mövcud</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-red-600" />
          <span className="text-xs text-foreground">Tutulmuş</span>
        </div>
      </div>

      {/* Instructions */}
      <div className="absolute right-4 top-4 rounded-lg bg-background/90 px-4 py-2 backdrop-blur-sm">
        <p className="text-xs text-muted-foreground">
          Masanı seçmək üçün üzərinə klikləyin
        </p>
      </div>

      {/* Selected table info */}
      {selectedTable && (
        <div className="absolute bottom-4 right-4 rounded-lg bg-primary px-4 py-2 text-primary-foreground">
          <p className="text-sm font-medium">Masa #{selectedTable} seçildi</p>
        </div>
      )}
    </div>
  );
};

export default TableSelection3D;
