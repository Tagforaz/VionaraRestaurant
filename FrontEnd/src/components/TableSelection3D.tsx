import { useRef, useState, Suspense, useEffect } from 'react';
import { Canvas, useFrame, ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Text, PerspectiveCamera, Environment } from '@react-three/drei';
import { useTranslation } from 'react-i18next';
import * as THREE from 'three';

interface TableProps {
  id: number;
  position: [number, number, number];
  tableNumber: number;
  seats: number;
  isSelected: boolean;
  isAvailable: boolean;
  onClick: () => void;
  editable?: boolean;
  onMove?: (id: number, position: [number, number, number]) => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  disableDrag?: boolean;
}

const Table = ({ id, position, tableNumber, seats, isSelected, isAvailable, onClick, editable, onMove, onDragStart, onDragEnd, disableDrag }: TableProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const [dragging, setDragging] = useState(false);
  const planeRef = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0));
  const tmpVec = useRef(new THREE.Vector3());

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
    ? '#f59e0b'
    : isAvailable
      ? (hovered ? '#93c5fd' : '#60a5fa') // hover: lighter blue, default: vivid blue
      : '#dc2626'; // red for unavailable

  const handleClick = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (isAvailable) {
      onClick();
    }
  };

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    // Only start dragging if already selected, in edit mode, and not disabled
    if (editable && isSelected && !disableDrag) {
      setDragging(true);
      document.body.style.cursor = 'grabbing';
      onDragStart && onDragStart();
    }
  };

  const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
    if (!dragging) return;
    e.stopPropagation();
    const hit = e.ray.intersectPlane(planeRef.current, tmpVec.current);
    if (hit && groupRef.current) {
      // Don't update position immediately - just store in temp
      tmpVec.current.y = groupRef.current.position.y;
      groupRef.current.position.x = tmpVec.current.x;
      groupRef.current.position.z = tmpVec.current.z;
      onMove && onMove(id, [tmpVec.current.x, tmpVec.current.y, tmpVec.current.z]);
    }
  };

  const handlePointerUp = (e: ThreeEvent<PointerEvent>) => {
    if (dragging) {
      setDragging(false);
      document.body.style.cursor = 'auto';
      onDragEnd && onDragEnd();
    }
  };

  // Table dimensions based on seats
  const tableRadius = seats <= 2 ? 0.4 : seats <= 4 ? 0.55 : seats <= 6 ? 0.7 : seats <= 8 ? 0.85 : seats <= 10 ? 1.0 : 1.1;
  const tableHeight = 0.08;

  return (
    <group 
      ref={groupRef} 
      position={position}
      onClick={handleClick}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = isAvailable ? 'pointer' : 'not-allowed'; }}
      onPointerOut={() => { setHovered(false); document.body.style.cursor = 'auto'; }}
    >
      {/* Table top */}
      <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[tableRadius, tableRadius, tableHeight, 32]} />
        <meshStandardMaterial
          color={tableColor}
          metalness={0.25}
          roughness={0.45}
          emissive={isAvailable ? '#60a5fa' : '#000000'}
          emissiveIntensity={isSelected ? 0.3 : (isAvailable ? 0.08 : 0)}
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
        // removed hard-coded font path to avoid loading a missing/corrupt font file
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

      {/* Editable subtle ring for editable but not selected tables */}
      {editable && !isSelected && (
        <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[tableRadius + 0.35, tableRadius + 0.37, 32]} />
          <meshBasicMaterial color="#60a5fa" transparent opacity={0.12} />
        </mesh>
      )}
    </group>
  );
};

const Floor = () => {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
      <planeGeometry args={[12, 12]} />
      <meshStandardMaterial color="#efe6d1" metalness={0.02} roughness={0.95} />
    </mesh>
  );
};

const RestaurantWalls = () => {
  return (
    <group>
      {/* Back wall */}
      <mesh position={[0, 1.5, -5]} receiveShadow>
        <boxGeometry args={[12, 3, 0.1]} />
        <meshStandardMaterial color="#efe6d1" metalness={0.02} roughness={0.88} />
      </mesh>
      {/* Side walls */}
      <mesh position={[-5.5, 1.5, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <boxGeometry args={[10, 3, 0.1]} />
        <meshStandardMaterial color="#efe6d1" metalness={0.02} roughness={0.88} />
      </mesh>
      <mesh position={[5.5, 1.5, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <boxGeometry args={[10, 3, 0.1]} />
        <meshStandardMaterial color="#efe6d1" metalness={0.02} roughness={0.88} />
      </mesh>
    </group>
  );
};

export interface TableData {
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
  // optional editable mode + external table data
  tables?: TableData[];
  onTablesChange?: (tables: TableData[]) => void;
  editable?: boolean;
  // when true, pointer drag will be disabled and arrow keys can move selected table
  disableDrag?: boolean;
  keyboardMove?: boolean;
  // movement step per arrow key press
  moveStep?: number;
}

const DEFAULT_TABLES: TableData[] = [
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

// Helper function to calculate table radius based on seats
const getTableRadius = (seats: number): number => {
  if (seats <= 2) return 0.4;
  if (seats <= 4) return 0.55;
  if (seats <= 6) return 0.7;
  if (seats <= 8) return 0.85;
  if (seats <= 10) return 1.0;
  return 1.1; // for 11-12 person tables
};

// Helper function to check if two tables collide
const checkCollision = (pos1: [number, number, number], seats1: number, pos2: [number, number, number], seats2: number): boolean => {
  const radius1 = getTableRadius(seats1) + 0.35; // add chair distance
  const radius2 = getTableRadius(seats2) + 0.35;
  const minDistance = radius1 + radius2 + 0.3; // add safety margin
  
  const dx = pos1[0] - pos2[0];
  const dz = pos1[2] - pos2[2];
  const distance = Math.sqrt(dx * dx + dz * dz);
  
  return distance < minDistance;
};

// Helper function to validate table position against all other tables
const isValidPosition = (tableId: number, newPos: [number, number, number], seats: number, allTables: TableData[]): boolean => {
  for (const other of allTables) {
    if (other.id === tableId) continue;
    if (checkCollision(newPos, seats, other.position, other.seats)) {
      return false;
    }
  }
  return true;
};

const Scene = ({ selectedTable, onTableSelect, partySize, tables, editable, onTablesChange, disableDrag }: TableSelection3DProps) => {
  const controlsRef = useRef<any>(null);

  const handleDragStart = () => {
    if (controlsRef.current) controlsRef.current.enabled = false;
  };

  const handleDragEnd = () => {
    if (controlsRef.current) controlsRef.current.enabled = true;
  };

  const handleTableMove = (id: number, pos: [number, number, number]) => {
    const currentTables = tables || DEFAULT_TABLES;
    const movingTable = currentTables.find(t => t.id === id);
    if (!movingTable) return;

    // Check if new position collides with other tables
    if (!isValidPosition(id, pos, movingTable.seats, currentTables)) {
      return; // Don't update position if collision detected
    }

    const next = currentTables.map(t => t.id === id ? { ...t, position: pos } : t);
    onTablesChange?.(next);
  };
  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 8, 8]} fov={50} />
      <OrbitControls 
        ref={controlsRef}
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
      {(tables || DEFAULT_TABLES).map((table, idx) => (
        <Table
          key={table.id}
          id={table.id}
          position={table.position}
          tableNumber={table.number}
          seats={table.seats}
          isSelected={selectedTable === table.number}
          isAvailable={table.isAvailable && table.seats >= partySize}
          onClick={() => onTableSelect(table.number)}
          editable={editable}
          // pass disableDrag to prevent pointer drag when requested
          {...(disableDrag ? { editable: editable, /* disabled drag handled inside Table via editable + prop */ } : {})}
          disableDrag={disableDrag}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onMove={handleTableMove}
        />
      ))}
    </>
  );
};

const TableSelection3D = ({ selectedTable, onTableSelect, partySize, tables, onTablesChange, editable, disableDrag, keyboardMove, moveStep = 0.25 }: TableSelection3DProps) => {
  const { t } = useTranslation();
  const [internalTables, setInternalTables] = useState<TableData[]>(tables || DEFAULT_TABLES);
  // sync when prop changes
  if (tables && tables !== internalTables) {
    // shallow replace when external tables provided
    setInternalTables(tables);
  }

  const handleTablesChange = (next: TableData[]) => {
    setInternalTables(next);
    onTablesChange?.(next);
  };

  // keyboard movement: arrow keys move selected table by `moveStep`
  useEffect(() => {
    if (!editable || !keyboardMove) return;
    const onKey = (e: KeyboardEvent) => {
      if (!selectedTable) return;
      const key = e.key;
      const delta = { x: 0, z: 0 };
      if (key === 'ArrowUp') delta.z = -moveStep;
      else if (key === 'ArrowDown') delta.z = moveStep;
      else if (key === 'ArrowLeft') delta.x = -moveStep;
      else if (key === 'ArrowRight') delta.x = moveStep;
      else return;
      e.preventDefault();
      setInternalTables((prev) => {
        const selectedTableData = prev.find(t => t.number === selectedTable);
        if (!selectedTableData) return prev;
        
        const newPos: [number, number, number] = [
          selectedTableData.position[0] + delta.x, 
          selectedTableData.position[1], 
          selectedTableData.position[2] + delta.z
        ];
        
        // Check collision before updating
        if (!isValidPosition(selectedTableData.id, newPos, selectedTableData.seats, prev)) {
          return prev; // Don't move if collision detected
        }
        
        const next = prev.map(t => {
          if (t.number !== selectedTable) return t;
          return { ...t, position: newPos };
        });
        onTablesChange?.(next);
        return next;
      });
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [editable, keyboardMove, selectedTable, moveStep, onTablesChange]);

  return (
    <div className="relative h-[400px] w-full overflow-hidden rounded-xl bg-stone-900">
      <Canvas shadows>
        <Suspense fallback={null}>
          <Scene 
            selectedTable={selectedTable} 
            onTableSelect={onTableSelect}
            partySize={partySize}
            tables={internalTables}
            editable={editable}
            onTablesChange={handleTablesChange}
            disableDrag={disableDrag}
          />
        </Suspense>
      </Canvas>
      
      {/* Legend */}
      <div className="absolute bottom-4 left-4 flex flex-wrap gap-3 rounded-lg bg-background/90 px-4 py-2 backdrop-blur-sm pointer-events-none">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-amber-400" />
          <span className="text-xs text-foreground">{t('table.selected')}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-blue-400" />
          <span className="text-xs text-foreground">{t('table.available')}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-red-600" />
          <span className="text-xs text-foreground">{t('table.occupied')}</span>
        </div>
      </div>

      {/* Instructions */}
      <div className="absolute right-4 top-4 rounded-lg bg-background/90 px-4 py-2 backdrop-blur-sm pointer-events-none">
        <p className="text-xs text-muted-foreground">
          {t('table.clickToSelect')}
        </p>
      </div>

      {/* Selected table info */}
      {selectedTable && (
        <div className="absolute bottom-4 right-4 rounded-lg bg-primary px-4 py-2 text-primary-foreground pointer-events-auto">
          <p className="text-sm font-medium">{t('table.tableSelected', { number: selectedTable })}</p>
        </div>
      )}

      {/* Editable hint */}
      {editable && (
        <div className="absolute top-4 left-4 rounded-lg bg-background/90 px-4 py-2 backdrop-blur-sm">
          <p className="text-xs text-muted-foreground">
            {t('table.editModeHint')}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {t('table.moveHint')}
          </p>
        </div>
      )}
    </div>
  );
};

export default TableSelection3D;
