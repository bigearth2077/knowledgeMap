<template>
  <div class="flex h-full bg-base-100 text-base-content">
    <!-- Sidebar -->
    <aside class="w-72 bg-base-200 border-r border-base-300 flex flex-col">
      <!-- Search & new conversation -->
      <div class="p-4 join w-full items-center gap-2">
        <input
          v-model="search"
          placeholder="搜索会话…"
          class="input input-bordered join-item flex-1"
        />
        <button class="btn btn-square btn-primary join-item" @click="startNewConversation">
          <Plus class="w-5 h-5" />
        </button>
      </div>
      <!-- Conversation List -->
      <div class="flex-1 overflow-y-auto">
        <ul class="menu pt-0">
          <li
            v-for="conv in filteredConversations"
            :key="conv.id"
            :class="{ 'bg-primary text-primary-content': conv.id === currentConvId }"
          >
            <div
              class="flex items-center justify-between group px-4 py-2 hover:bg-base-300/50 rounded-md"
            >
              <button
                class="flex items-center gap-2 flex-1 text-left truncate"
                @click="selectConversation(conv)"
              >
                <MessageSquare class="w-4 h-4 opacity-60" />
                {{ conv.title || '未命名会话' }}
              </button>
              <div class="opacity-0 group-hover:opacity-100 transition-opacity duration-150 ml-2">
                <div class="dropdown dropdown-end">
                  <button tabindex="0" class="btn btn-ghost btn-square btn-xs">
                    <MoreHorizontal class="w-4 h-4" />
                  </button>
                  <ul
                    tabindex="0"
                    class="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-36 space-y-1"
                  >
                    <li>
                      <button class="flex items-center gap-2" @click="renameConversation(conv)">
                        <PencilLine class="w-4 h-4 opacity-70" /> 重命名
                      </button>
                    </li>
                    <li>
                      <button
                        class="flex items-center gap-2 text-error"
                        @click="deleteConversation(conv)"
                      >
                        <Trash2 class="w-4 h-4 opacity-70" /> 删除
                      </button>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </li>
        </ul>
      </div>
    </aside>

    <!-- Main chat -->
    <section class="flex-1 flex flex-col">
      <!-- Header -->
      <header
        class="flex items-center justify-between px-4 py-2 bg-base-200 border-b border-base-300 shrink-0"
      >
        <h3 class="text-lg font-semibold truncate max-w-[70%]">
          {{ currentTitle || '新对话' }}
        </h3>
        <button class="btn btn-ghost btn-sm" @click="emit('close')">
          <X class="w-5 h-5" />
        </button>
      </header>

      <!-- Messages -->
      <div ref="scrollContainer" class="relative flex-1 overflow-y-auto px-4 py-4 space-y-2">
        <!-- Placeholder -->
        <div
          v-if="!messages.length"
          class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-base-content/60 gap-1"
        >
          <HelpCircle class="w-10 h-10" />
          <p class="text-lg font-medium">What's on your mind today?</p>
          <p class="text-sm">我有什么可以帮助你的？</p>
        </div>

        <VirtualList
          v-else
          :data-key="'id'"
          :data-sources="messages"
          :data-component="ChatBubble"
          :keeps="40"
          :estimate-size="estimateSize"
        />
      </div>

      <!-- Input -->
      <form
        class="p-4 border-t border-base-300 flex items-end gap-2 bg-base-200/50"
        @submit.prevent="send"
      >
        <div class="relative flex-1">
          <textarea
            ref="textareaRef"
            v-model="input"
            :rows="expanded ? 8 : 1"
            placeholder="输入消息，Enter 发送，Shift+Enter 换行"
            @keydown.enter.exact.prevent="send"
            class="textarea textarea-bordered w-full resize-none pr-10"
          ></textarea>
          <button
            type="button"
            class="absolute bottom-2 right-2 btn btn-xs btn-ghost"
            @click="expanded = !expanded"
          >
            <component :is="expanded ? Minimize2 : Maximize2" class="w-4 h-4" />
          </button>
        </div>
        <button
          class="btn btn-primary self-stretch flex items-center"
          type="submit"
          :disabled="sending"
        >
          <span v-if="sending" class="loading loading-spinner loading-sm mr-1" />
          发送
        </button>
      </form>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, defineComponent, h, PropType, watch } from 'vue'
import axios from '@/services/api'
import { marked } from 'marked'
import VirtualList from 'vue3-virtual-scroll-list'
import {
  Plus,
  MoreHorizontal,
  MessageSquare,
  PencilLine,
  Trash2,
  Maximize2,
  Minimize2,
  X,
  HelpCircle,
  Loader2,
  User as UserIcon,
  Bot as BotIcon,
} from 'lucide-vue-next'

interface Conversation {
  id: string
  title: string
  created_at: string
}
interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
  loading?: boolean
}

const emit = defineEmits(['close'])

// state
const conversations = ref<Conversation[]>([])
const currentConvId = ref<string>('')
const messages = ref<Message[]>([])
const sending = ref(false)
const input = ref('')
const search = ref('')
const expanded = ref(false)
const textareaRef = ref<HTMLTextAreaElement | null>(null)
const scrollContainer = ref<HTMLElement | null>(null)
const estimateSize = 100

watch(expanded, (v) => v && textareaRef.value && nextTick(() => textareaRef.value!.focus()))

// computed
const filteredConversations = computed(() =>
  !search.value.trim()
    ? conversations.value
    : conversations.value.filter((c) => c.title.toLowerCase().includes(search.value.toLowerCase())),
)
const currentTitle = computed(
  () => conversations.value.find((c) => c.id === currentConvId.value)?.title ?? '',
)

// helpers
const normalizeId = (id: unknown) => (typeof id === 'string' ? id : String(id))

// api
async function fetchConversations() {
  const { data } = await axios.get('/api/student/history/lists')
  conversations.value = data.map((c: any) => ({ ...c, id: normalizeId(c.id) }))
}
async function fetchMessages() {
  if (!currentConvId.value) return
  const { data } = await axios.get('/api/student/conversation', {
    params: { conversation_id: currentConvId.value },
  })
  messages.value = data.messages.map((m: any) => ({ ...m, id: normalizeId(m.id) }))
  await nextTick()
  scrollToBottom()
}

// ui helpers
function scrollToBottom() {
  nextTick(() => {
    const el = scrollContainer.value
    if (el) el.scrollTop = el.scrollHeight
  })
}

// actions
function startNewConversation() {
  currentConvId.value = ''
  messages.value = []
  input.value = ''
  textareaRef.value?.focus()
}

async function send() {
  if (!input.value.trim()) return
  const text = input.value
  input.value = ''
  messages.value.push({
    id: Date.now().toString(),
    role: 'user',
    content: text,
    created_at: new Date().toISOString(),
  })
  const loadingId = `loading-${Date.now()}`
  messages.value.push({
    id: loadingId,
    role: 'assistant',
    content: '',
    created_at: new Date().toISOString(),
    loading: true,
  })
  scrollToBottom()
  try {
    sending.value = true
    const { data } = await axios.post('/api/ask', {
      question: text,
      conversation_id: currentConvId.value || undefined,
    })
    if (!currentConvId.value) {
      currentConvId.value = normalizeId(data.conversation_id)
      await fetchConversations()
    }
    await fetchMessages()
    // const assistant = data.message ?? data.messages?.[0]
    // const idx = messages.value.findIndex((m) => m.id === loadingId)
    // if (assistant && idx !== -1) {
    //   messages.value[idx] = {
    //     ...assistant,
    //     id: normalizeId(assistant.id ?? loadingId),
    //     role: 'assistant',
    //     created_at: assistant.created_at ?? new Date().toISOString(),
    //   }
    // } else {
    //   messages.value = messages.value.filter((m) => m.id !== loadingId)
    // }
    scrollToBottom()
  } finally {
    sending.value = false
  }
}

function selectConversation(conv: Conversation) {
  currentConvId.value = conv.id
  fetchMessages()
}
async function renameConversation(conv: Conversation, newTitle?: string) {
  const t = newTitle ?? prompt('新的标题', conv.title)
  if (!t || t === conv.title) return
  await axios.put('/api/conversations/title', { conversation_id: conv.id, title: t })
  conv.title = t
}
async function deleteConversation(conv: Conversation) {
  if (!confirm(`确定删除会话「${conv.title}」?`)) return
  await axios.post('/api/conversations/delete', { conversation_id: conv.id })
  conversations.value = conversations.value.filter((c) => c.id !== conv.id)
  if (currentConvId.value === conv.id) startNewConversation()
}

onMounted(fetchConversations)

// ChatBubble
const ChatBubble = defineComponent({
  name: 'ChatBubble',
  props: { source: { type: Object as PropType<Message>, required: true } },
  setup(props) {
    const html = computed(() =>
      props.source.loading
        ? ''
        : props.source.role === 'assistant'
          ? marked.parse(props.source.content)
          : props.source.content,
    )
    const icon = computed(() => (props.source.role === 'user' ? UserIcon : BotIcon))
    const bubbleClass = computed(() => (props.source.role === 'user' ? 'bubble-user' : 'bubble-ai'))
    return () =>
      h('div', { class: ['chat', props.source.role === 'user' ? 'chat-end' : 'chat-start'] }, [
        h('div', { class: 'chat-image avatar' }, [h(icon.value, { class: 'w-8 h-8 opacity-80' })]),
        props.source.loading
          ? h(
              'div',
              { class: ['chat-bubble', 'bubble-ai', 'flex', 'items-center', 'justify-center'] },
              [h(Loader2, { class: 'w-5 h-5 animate-spin' })],
            )
          : h('div', {
              class: [
                'chat-bubble',
                bubbleClass.value,
                'whitespace-pre-wrap',
                'prose',
                'max-w-full',
              ],
              innerHTML: html.value,
            }),
      ])
  },
})
</script>

<style scoped>
/***** custom scrollbar *****/
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
::-webkit-scrollbar-thumb {
  background-color: hsl(var(--bc) / 0.3);
  border-radius: 4px;
}

/* High‑end bubble palette that adapts to theme */
.bubble-user {
  background-color: hsl(var(--p) / 0.85);
  color: hsl(var(--pc));
}
.bubble-ai {
  background-color: hsl(var(--b2) / 0.8); /* base‑200 */
  color: hsl(var(--bc));
}

/* chat bubble prose overrides – explicit utilities (no @apply) */
.prose :where(code) {
  padding: 0.125rem 0.25rem; /* py‑0.5 px‑1 */
  background-color: hsl(var(--b3)); /* bg‑base‑300 */
  border-radius: 0.25rem; /* rounded */
  font-size: 0.875rem; /* text‑sm */
  line-height: 1.25rem;
}
</style>
