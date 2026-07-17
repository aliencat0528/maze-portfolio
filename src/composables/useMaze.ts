import type { MazeCell, NodeId, Point } from '@/types'
import { entranceConfig, roomConfigs } from '@/data/resumeData'

/**
 * 迷宮幾何層（MR-002）—— 純函式，不含任何 Vue 響應式狀態。
 *
 * 唯一真相是 resumeData 的 position + connections。此檔案負責把那份拓撲
 * 展開成一張可以行走的格子圖，不再有第二套硬編座標。
 */

/**
 * 邏輯座標 ×2 展開為格子座標。
 * 邏輯上相鄰的兩個房間（例如 origin(1,0) 與 quest(2,0)）若不展開會直接貼在一起，
 * 中間沒有格子可以放走廊。×2 之後兩者變成 (2,0) 與 (4,0)，空出 (3,0) 當走廊。
 */
const GRID_SCALE = 2

export const cellKey = (p: Point): string => `${p.x},${p.y}`

const toGrid = (p: Point): Point => ({ x: p.x * GRID_SCALE, y: p.y * GRID_SCALE })

const DIRECTIONS: Point[] = [
  { x: 0, y: -1 },
  { x: 0, y: 1 },
  { x: -1, y: 0 },
  { x: 1, y: 0 }
]

export interface MazeLayout {
  /** 所有可走的格子，key 為 cellKey */
  cells: Map<string, MazeCell>
  /** 節點 → 其所在格子 */
  nodeCell: Map<NodeId, Point>
  width: number
  height: number
}

/**
 * L 形繞徑，回傳「不含起點與終點」的中繼走廊格。
 *
 * 先試垂直優先；若會穿過其他房間就改水平優先。兩種都撞牆時回傳 null —— 這代表
 * 資料層的 position 擺放與 connections 兜不攏，屬於設定錯誤，應該讓它被看見
 * 而不是默默畫出一條穿牆的走廊。
 */
function routeCorridor(from: Point, to: Point, roomCells: Set<string>): Point[] | null {
  const attempt = (verticalFirst: boolean): Point[] | null => {
    const path: Point[] = []
    let { x, y } = from

    const walkVertical = () => {
      while (y !== to.y) {
        y += Math.sign(to.y - y)
        path.push({ x, y })
      }
    }
    const walkHorizontal = () => {
      while (x !== to.x) {
        x += Math.sign(to.x - x)
        path.push({ x, y })
      }
    }

    if (verticalFirst) {
      walkVertical()
      walkHorizontal()
    } else {
      walkHorizontal()
      walkVertical()
    }

    // path 的最後一格就是終點房間本身，走廊不該包含它
    const middle = path.slice(0, -1)
    return middle.some(cell => roomCells.has(cellKey(cell))) ? null : middle
  }

  return attempt(true) ?? attempt(false)
}

/** 從 connections 收集去重後的無向邊 */
function collectEdges(): [NodeId, NodeId][] {
  const seen = new Set<string>()
  const edges: [NodeId, NodeId][] = []

  const add = (a: NodeId, b: NodeId) => {
    const key = [a, b].sort().join('|')
    if (seen.has(key)) return
    seen.add(key)
    edges.push([a, b])
  }

  entranceConfig.connections.forEach(to => add('entrance', to))
  roomConfigs.forEach(room => room.connections.forEach(to => add(room.id, to)))

  return edges
}

/**
 * 節點層級的雙向鄰接表（房間 ↔ 房間，非格子層級）。
 * 迷霧的「鄰接可見」判斷用這個 —— 是拓撲上的相鄰，不是格子距離上的相鄰。
 */
export function buildNodeAdjacency(): Map<NodeId, NodeId[]> {
  const adjacency = new Map<NodeId, NodeId[]>()

  const link = (a: NodeId, b: NodeId) => {
    const list = adjacency.get(a) ?? []
    if (!list.includes(b)) list.push(b)
    adjacency.set(a, list)
  }

  collectEdges().forEach(([a, b]) => {
    link(a, b)
    link(b, a)
  })

  return adjacency
}

export function buildMaze(): MazeLayout {
  const nodeCell = new Map<NodeId, Point>()
  nodeCell.set('entrance', toGrid(entranceConfig.position))
  roomConfigs.forEach(room => nodeCell.set(room.id, toGrid(room.position)))

  const roomCells = new Set([...nodeCell.values()].map(cellKey))
  const cells = new Map<string, MazeCell>()

  nodeCell.forEach((point, nodeId) => {
    cells.set(cellKey(point), { point, kind: 'room', nodeId })
  })

  collectEdges().forEach(([a, b]) => {
    const from = nodeCell.get(a)
    const to = nodeCell.get(b)
    if (!from || !to) return

    const corridor = routeCorridor(from, to, roomCells)
    if (!corridor) {
      console.warn(`[maze] ${a} → ${b} 無法繞徑：垂直與水平優先都會穿過其他房間`)
      return
    }

    corridor.forEach(point => {
      const key = cellKey(point)
      if (!cells.has(key)) cells.set(key, { point, kind: 'corridor' })
    })
  })

  const points = [...cells.values()].map(cell => cell.point)

  return {
    cells,
    nodeCell,
    width: Math.max(...points.map(p => p.x)) + 1,
    height: Math.max(...points.map(p => p.y)) + 1
  }
}

/** 某格子四方向中，實際可走的鄰居 */
export function walkableNeighbors(point: Point, cells: Map<string, MazeCell>): Point[] {
  return DIRECTIONS
    .map(dir => ({ x: point.x + dir.x, y: point.y + dir.y }))
    .filter(next => cells.has(cellKey(next)))
}

/**
 * BFS 最短路徑，回傳「不含起點、含終點」的格子序列；不可達時回傳空陣列。
 * 手機點擊房間後由角色自動走過去用的 —— 不做虛擬搖桿的原因見 MR-002。
 */
export function findPath(from: Point, to: Point, cells: Map<string, MazeCell>): Point[] {
  const startKey = cellKey(from)
  const goalKey = cellKey(to)
  if (startKey === goalKey) return []

  const cameFrom = new Map<string, Point>()
  const seen = new Set<string>([startKey])
  const queue: Point[] = [from]

  while (queue.length > 0) {
    const current = queue.shift() as Point

    for (const next of walkableNeighbors(current, cells)) {
      const key = cellKey(next)
      if (seen.has(key)) continue

      seen.add(key)
      cameFrom.set(key, current)

      if (key === goalKey) {
        const path: Point[] = []
        let step: Point | undefined = next
        while (step && cellKey(step) !== startKey) {
          path.unshift(step)
          step = cameFrom.get(cellKey(step))
        }
        return path
      }

      queue.push(next)
    }
  }

  return []
}
