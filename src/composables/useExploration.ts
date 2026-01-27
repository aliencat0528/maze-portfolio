import { ref, computed } from 'vue'
import type { RoomType, MazePath } from '@/types'
import { roomConfigs } from '@/data/resumeData'

// 探索狀態管理
const visitedRooms = ref<RoomType[]>([])
const exploredPaths = ref<MazePath[]>([])
const currentRoom = ref<RoomType | 'entrance'>('entrance')
const isTransitioning = ref(false)

export function useExploration() {
  // 計算探索進度
  const explorationProgress = computed(() => {
    return {
      visited: visitedRooms.value.length,
      total: roomConfigs.length,
      percentage: Math.round((visitedRooms.value.length / roomConfigs.length) * 100)
    }
  })

  // 檢查房間是否已訪問
  const isRoomVisited = (roomId: RoomType) => {
    return visitedRooms.value.includes(roomId)
  }

  // 檢查路徑是否已探索
  const isPathExplored = (from: RoomType | 'entrance', to: RoomType) => {
    return exploredPaths.value.some(
      path => (path.from === from && path.to === to) || (path.from === to && path.to === from)
    )
  }

  // 進入房間
  const enterRoom = async (roomId: RoomType) => {
    if (isTransitioning.value) return

    isTransitioning.value = true

    // 記錄路徑
    if (currentRoom.value !== roomId) {
      const newPath: MazePath = {
        from: currentRoom.value as RoomType,
        to: roomId,
        explored: true
      }

      if (!isPathExplored(currentRoom.value, roomId)) {
        exploredPaths.value.push(newPath)
      }
    }

    // 更新當前房間
    currentRoom.value = roomId

    // 記錄訪問
    if (!visitedRooms.value.includes(roomId)) {
      visitedRooms.value.push(roomId)
    }

    // 等待過場動畫
    await new Promise(resolve => setTimeout(resolve, 500))

    isTransitioning.value = false
  }

  // 返回迷宮入口
  const exitRoom = async () => {
    if (isTransitioning.value) return

    isTransitioning.value = true
    currentRoom.value = 'entrance'

    await new Promise(resolve => setTimeout(resolve, 300))

    isTransitioning.value = false
  }

  // 取得房間配置
  const getRoomConfig = (roomId: RoomType) => {
    return roomConfigs.find(room => room.id === roomId)
  }

  // 取得相鄰房間
  const getConnectedRooms = (roomId: RoomType | 'entrance') => {
    if (roomId === 'entrance') {
      // 入口連接所有房間
      return roomConfigs.map(room => room.id)
    }
    const room = getRoomConfig(roomId)
    return room?.connections || []
  }

  // 重置探索狀態
  const resetExploration = () => {
    visitedRooms.value = []
    exploredPaths.value = []
    currentRoom.value = 'entrance'
    isTransitioning.value = false
  }

  // 檢查是否完成所有探索
  const isFullyExplored = computed(() => {
    return visitedRooms.value.length === roomConfigs.length
  })

  return {
    // 狀態
    visitedRooms,
    exploredPaths,
    currentRoom,
    isTransitioning,

    // 計算屬性
    explorationProgress,
    isFullyExplored,

    // 方法
    isRoomVisited,
    isPathExplored,
    enterRoom,
    exitRoom,
    getRoomConfig,
    getConnectedRooms,
    resetExploration
  }
}
