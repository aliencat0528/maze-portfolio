import { computed, ref } from 'vue'
import type { FogLevel, MazeCell, NodeId, Point, RoomType } from '@/types'
import { roomConfigs } from '@/data/resumeData'
import { buildMaze, buildNodeAdjacency, cellKey, findPath, walkableNeighbors } from './useMaze'

/**
 * 探索狀態（MR-002）。
 *
 * 與改寫前的差異：先前只記錄「訪問過哪些房間」，房間之間沒有可走的空間，
 * 探索進度也不影響任何事。現在角色有實際格子座標，必須沿走廊移動。
 */

// 迷宮拓撲在模組載入時建一次即可 —— 它由靜態資料推導，執行期不會變。
const maze = buildMaze()
const adjacency = buildNodeAdjacency()

const ENTRANCE_CELL = maze.nodeCell.get('entrance') as Point

/** 每走一格的間隔，尋路動畫用 */
const STEP_MS = 90

const playerCell = ref<Point>({ ...ENTRANCE_CELL })
const visitedNodes = ref<Set<NodeId>>(new Set<NodeId>(['entrance']))
const walkedCells = ref<Set<string>>(new Set([cellKey(ENTRANCE_CELL)]))
const openRoom = ref<RoomType | null>(null)
const isMoving = ref(false)
const showOverview = ref(false)

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export function useExploration() {
  /** 角色腳下的節點；站在走廊上時為 undefined */
  const standingOn = computed<NodeId | undefined>(
    () => maze.cells.get(cellKey(playerCell.value))?.nodeId
  )

  const explorationProgress = computed(() => {
    const visited = roomConfigs.filter(room => visitedNodes.value.has(room.id)).length
    return {
      visited,
      total: roomConfigs.length,
      percentage: Math.round((visited / roomConfigs.length) * 100)
    }
  })

  const isFullyExplored = computed(
    () => explorationProgress.value.visited === roomConfigs.length
  )

  const isRoomVisited = (nodeId: NodeId) => visitedNodes.value.has(nodeId)

  /**
   * 節點的迷霧層級：已訪問全亮、與已訪問房間拓撲相鄰則露出暗輪廓、其餘全黑。
   * 總覽模式直接揭開全圖 —— 遊戲層不能變成擋住履歷的路障（MR-001）。
   */
  const nodeFog = (nodeId: NodeId): FogLevel => {
    if (showOverview.value) return 'visible'
    if (visitedNodes.value.has(nodeId)) return 'visible'

    const neighbors = adjacency.get(nodeId) ?? []
    return neighbors.some(neighbor => visitedNodes.value.has(neighbor)) ? 'dim' : 'hidden'
  }

  /** 走廊的迷霧：走過就亮；緊鄰已走過的格子或已訪問房間則露出暗輪廓 */
  const cellFog = (cell: MazeCell): FogLevel => {
    if (showOverview.value) return 'visible'
    if (cell.kind === 'room') return nodeFog(cell.nodeId as NodeId)
    if (walkedCells.value.has(cellKey(cell.point))) return 'visible'

    const nearKnown = walkableNeighbors(cell.point, maze.cells).some(point => {
      if (walkedCells.value.has(cellKey(point))) return true
      const neighbor = maze.cells.get(cellKey(point))
      return neighbor?.kind === 'room' && visitedNodes.value.has(neighbor.nodeId as NodeId)
    })

    return nearKnown ? 'dim' : 'hidden'
  }

  const moveTo = (target: Point): boolean => {
    const cell = maze.cells.get(cellKey(target))
    if (!cell) return false

    playerCell.value = target
    walkedCells.value.add(cellKey(target))
    if (cell.nodeId) visitedNodes.value.add(cell.nodeId)

    return true
  }

  /** 桌機方向鍵：一次一格，撞牆就原地不動 */
  const step = (dx: number, dy: number): boolean => {
    if (isMoving.value || openRoom.value) return false
    return moveTo({ x: playerCell.value.x + dx, y: playerCell.value.y + dy })
  }

  /** 走到某節點並開啟房間。手機點擊與桌機點擊共用同一套邏輯，差別只在輸入方式 */
  const goToNode = async (nodeId: NodeId) => {
    if (isMoving.value) return

    const target = maze.nodeCell.get(nodeId)
    // 還看不見的房間不能點 —— 你不該知道它存在
    if (!target || nodeFog(nodeId) === 'hidden') return

    const path = findPath(playerCell.value, target, maze.cells)
    isMoving.value = true
    for (const cell of path) {
      moveTo(cell)
      await sleep(STEP_MS)
    }
    isMoving.value = false

    if (nodeId !== 'entrance') openRoom.value = nodeId
  }

  /** 開啟角色腳下的房間（桌機 Enter 用） */
  const enterCurrentRoom = () => {
    const node = standingOn.value
    if (node && node !== 'entrance') openRoom.value = node
  }

  const exitRoom = () => {
    openRoom.value = null
  }

  const toggleOverview = () => {
    showOverview.value = !showOverview.value
  }

  const resetExploration = () => {
    playerCell.value = { ...ENTRANCE_CELL }
    visitedNodes.value = new Set<NodeId>(['entrance'])
    walkedCells.value = new Set([cellKey(ENTRANCE_CELL)])
    openRoom.value = null
    isMoving.value = false
    showOverview.value = false
  }

  return {
    maze,
    playerCell,
    visitedNodes,
    walkedCells,
    openRoom,
    isMoving,
    showOverview,

    standingOn,
    explorationProgress,
    isFullyExplored,

    isRoomVisited,
    nodeFog,
    cellFog,
    step,
    goToNode,
    enterCurrentRoom,
    exitRoom,
    toggleOverview,
    resetExploration
  }
}
