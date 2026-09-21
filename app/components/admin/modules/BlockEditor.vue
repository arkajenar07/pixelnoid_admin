<template>
  <div
    class="relative min-h-[240px] select-text [&_.px-inline-code]:font-mono [&_.px-inline-code]:text-[0.875em] [&_.px-inline-code]:bg-gray-100 [&_.px-inline-code]:text-[#121212] [&_.px-inline-code]:px-1.5 [&_.px-inline-code]:py-0.5 [&_.px-inline-code]:border [&_.px-inline-code]:border-gray-200 [&_a]:text-[#121212] [&_a]:underline [&_a]:underline-offset-2 [&_.px-table-wrapper_.px-editable:focus]:outline-none [&_.px-table-wrapper_.px-editable:focus]:bg-gray-50 text-[#121212]"
    @click="handleCanvasClick"
  >
    <!-- Blocks List -->
    <div class="relative">
      <div
        v-for="(block, index) in blocks"
        :key="block.id"
        :data-block-index="index"
        :data-block-type="block.type"
        :class="[
          'relative w-full transition-all duration-150 group/row',
          block.type === 'heading1' ? 'mt-4 mb-2' :
          block.type === 'heading2' ? 'mt-4 mb-2' :
          block.type === 'heading3' ? 'mt-3 mb-1' :
          block.type === 'paragraph' ? 'my-1' : 'my-3',
          {
            'opacity-40 scale-[0.99]': draggingIndex === index,
            'bg-gray-100 is-selected': selectedBlockIndices.has(index)
          }
        ]"
        @click="onRowClick($event, index)"
        @dragover.prevent="onDragOver($event, index)"
        @drop.prevent="onDrop(index)"
      >
        <!-- Drop Indicator Line (Visual Feedback for Smooth Reordering) -->
        <div
          v-if="dropTargetIndex === index && draggingIndex !== null && draggingIndex !== index"
          class="absolute left-0 right-0 h-1 bg-[#5530AB] z-30 pointer-events-none rounded-full shadow-sm flex items-center transition-all duration-150"
          :class="dropPosition === 'before' ? '-top-1.5' : '-bottom-1.5'"
        >
          <div class="w-2.5 h-2.5 rounded-full bg-[#5530AB] -ml-1 border-2 border-white shadow-sm" />
        </div>

        <!-- Gutter (floating on the left margin, accessible & touch-friendly) -->
        <div :class="[
          'absolute -left-[70px] sm:-left-[76px] flex items-center gap-0.5 opacity-0 pointer-events-none transition-opacity duration-150 select-none group-hover/row:opacity-100 group-hover/row:pointer-events-auto',
          (block.type === 'code' || block.type === 'image' || block.type === 'table' || block.type === 'canva' || block.type === 'bookmark') ? 'top-[4px] bottom-auto h-[32px]' : 'top-0 bottom-0',
          (activeBlockIndex === index || selectedBlockIndices.has(index)) ? '!opacity-100 !pointer-events-auto' : ''
        ]">
          <!-- Add block button (+) -->
          <button
            type="button"
            class="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 text-gray-400 bg-transparent rounded-md transition-all duration-150 hover:text-[#5530AB] hover:bg-gray-100/90 active:scale-95 cursor-pointer"
            title="Tambah blok baru di bawah (+)"
            aria-label="Tambah blok baru di bawah"
            @click.stop="openAddBlockMenu(index)"
          >
            <svg class="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <path d="M8 3v10M3 8h10" />
            </svg>
          </button>

          <!-- Drag handle & tune trigger (⋮⋮) -->
          <button
            type="button"
            class="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 text-gray-400 bg-transparent rounded-md transition-all duration-150 hover:text-[#121212] hover:bg-gray-100/90 cursor-grab active:cursor-grabbing active:scale-95"
            :class="{ '!text-[#5530AB]': selectedBlockIndices.has(index) }"
            title="Tarik untuk memindahkan / Klik untuk menu aksi"
            :aria-label="`Tarik untuk memindahkan blok ${index + 1}, atau tekan enter untuk menu`"
            :draggable="true"
            @dragstart="onDragStart($event, index)"
            @dragend="onDragEnd"
            @click.stop="toggleTuneMenu(index, $event)"
            @keydown.enter.stop="toggleTuneMenu(index, $event)"
          >
            <svg class="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor">
              <circle cx="5.5" cy="3.5" r="1.3" />
              <circle cx="10.5" cy="3.5" r="1.3" />
              <circle cx="5.5" cy="8" r="1.3" />
              <circle cx="10.5" cy="8" r="1.3" />
              <circle cx="5.5" cy="12.5" r="1.3" />
              <circle cx="10.5" cy="12.5" r="1.3" />
            </svg>
          </button>
        </div>

        <!-- Block Content Column -->
        <div class="relative w-full" @click.stop>
          <!-- Heading 1 -->
          <EditableArea
            v-if="block.type === 'heading1'"
            :ref="(el) => setEditableRef(el, index)"
            v-model="block.content"
            placeholder="Heading 1"
            custom-class="text-3xl font-bold text-[#121212] tracking-tight leading-[1.25] py-0.5"
            @input="handleInput(index)"
            @keydown="handleKeyDown($event, index)"
            @paste="handlePaste($event, index)"
            @focus="setActiveBlock(index)"
          />

          <!-- Heading 2 -->
          <EditableArea
            v-if="block.type === 'heading2'"
            :ref="(el) => setEditableRef(el, index)"
            v-model="block.content"
            placeholder="Heading 2"
            custom-class="text-2xl font-bold text-[#121212] tracking-tight leading-[1.3] py-0.5 border-b border-gray-200 pb-2"
            @input="handleInput(index)"
            @keydown="handleKeyDown($event, index)"
            @paste="handlePaste($event, index)"
            @focus="setActiveBlock(index)"
          />

          <!-- Heading 3 -->
          <EditableArea
            v-if="block.type === 'heading3'"
            :ref="(el) => setEditableRef(el, index)"
            v-model="block.content"
            placeholder="Heading 3"
            custom-class="text-xl font-semibold text-[#121212] leading-[1.35] py-0.5"
            @input="handleInput(index)"
            @keydown="handleKeyDown($event, index)"
            @paste="handlePaste($event, index)"
            @focus="setActiveBlock(index)"
          />

          <!-- Paragraph -->
          <EditableArea
            v-if="block.type === 'paragraph'"
            :ref="(el) => setEditableRef(el, index)"
            v-model="block.content"
            :placeholder="index === 0 ? 'Mulai menulis, atau ketik \'/\' untuk memilih tipe blok...' : 'Ketik \'/\' untuk memilih blok...'"
            custom-class="text-[1rem] text-[#121212] leading-[1.75] min-h-[1.75rem] py-0.5"
            @input="handleInput(index)"
            @keydown="handleKeyDown($event, index)"
            @paste="handlePaste($event, index)"
            @focus="setActiveBlock(index)"
          />

          <!-- Bullet List -->
          <div v-if="block.type === 'bulletList'" class="space-y-1">
            <div
              v-for="(item, itemIdx) in (block.items || [''])"
              :key="itemIdx"
              class="flex items-start gap-2.5"
            >
              <span class="text-[#121212] font-bold text-lg leading-[1.65] select-none shrink-0">•</span>
              <EditableArea
                :ref="(el) => setListEditableRef(el, index, itemIdx)"
                :model-value="item"
                placeholder="Poin daftar..."
                custom-class="flex-1 text-[1rem] text-[#121212] leading-[1.75] min-h-[1.75rem] py-0.5"
                @update:model-value="updateListItem(index, itemIdx, $event)"
                @keydown="handleListKeyDown($event, index, itemIdx)"
                @paste="handlePaste($event, index)"
                @focus="setActiveBlock(index)"
              />
            </div>
          </div>

          <!-- Numbered List -->
          <div v-if="block.type === 'numberedList'" class="space-y-1">
            <div
              v-for="(item, itemIdx) in (block.items || [''])"
              :key="itemIdx"
              class="flex items-start gap-2.5"
            >
              <span class="text-[#121212] font-semibold text-[0.95rem] leading-[1.75] min-w-[20px] select-none shrink-0">{{ itemIdx + 1 }}.</span>
              <EditableArea
                :ref="(el) => setListEditableRef(el, index, itemIdx)"
                :model-value="item"
                placeholder="Poin nomor..."
                custom-class="flex-1 text-[1rem] text-[#121212] leading-[1.75] min-h-[1.75rem] py-0.5"
                @update:model-value="updateListItem(index, itemIdx, $event)"
                @keydown="handleListKeyDown($event, index, itemIdx)"
                @paste="handlePaste($event, index)"
                @focus="setActiveBlock(index)"
              />
            </div>
          </div>

          <!-- Quote -->
          <div v-if="block.type === 'quote'" class="pl-4 py-1 border-l-2 border-[#121212]">
            <EditableArea
              :ref="(el) => setEditableRef(el, index)"
              v-model="block.content"
              placeholder="Kutipan..."
              custom-class="text-[1.1rem] italic text-gray-700 leading-relaxed min-h-[1.75rem]"
              @input="handleInput(index)"
              @keydown="handleKeyDown($event, index)"
              @paste="handlePaste($event, index)"
              @focus="setActiveBlock(index)"
            />
          </div>

          <!-- Callout -->
          <div v-if="block.type === 'callout'" class="p-4 bg-gray-50 border border-gray-200 flex items-start gap-3">
            <div class="text-xl select-none shrink-0 pt-0.5">💡</div>
            <EditableArea
              :ref="(el) => setEditableRef(el, index)"
              v-model="block.content"
              placeholder="Tulis catatan..."
              custom-class="flex-1 text-[0.95rem] text-[#121212] leading-relaxed min-h-[1.75rem]"
              @input="handleInput(index)"
              @keydown="handleKeyDown($event, index)"
              @paste="handlePaste($event, index)"
              @focus="setActiveBlock(index)"
            />
          </div>

          <!-- Code Block -->
          <div v-if="block.type === 'code'" class="bg-gray-50 border border-gray-200">
            <div class="flex items-center justify-between px-4 py-2 border-b border-gray-200 select-none">
              <div class="flex items-center gap-2">
                <span class="text-xs font-mono text-gray-500">KODE</span>
                <select
                  :value="block.language || 'javascript'"
                  class="bg-transparent text-xs font-mono text-[#121212] border-none outline-none cursor-pointer"
                  @change="updateCodeLang(index, ($event.target as HTMLSelectElement).value)"
                >
                  <option v-for="lang in codeLanguages" :key="lang" :value="lang">{{ lang }}</option>
                </select>
              </div>
              <button
                type="button"
                class="text-xs font-medium text-gray-500 hover:text-[#121212] transition-colors cursor-pointer"
                @click="copyCode(block.content || '', index)"
              >
                {{ copiedBlockIndex === index ? 'Tersalin' : 'Salin' }}
              </button>
            </div>
            <textarea
              :value="block.content || ''"
              placeholder="// Tulis kode..."
              rows="4"
              class="w-full bg-transparent text-[#121212] font-mono text-[0.85rem] p-4 leading-relaxed outline-none resize-y"
              @input="updateCodeContent(index, ($event.target as HTMLTextAreaElement).value)"
              @keydown.tab.prevent="insertTab($event, index)"
              @focus="setActiveBlock(index)"
            />
          </div>

          <!-- Table Block -->
          <div v-if="block.type === 'table' && block.tableData" class="w-full my-2">
            <!-- Table Toolbar (Settings & Quick Actions) -->
            <div class="flex items-center gap-4 py-2 mb-1 text-xs select-none">
              <button
                type="button"
                class="flex items-center gap-1.5 px-2 py-1 border text-xs font-medium cursor-pointer transition-colors"
                :class="block.tableData.withHeadings ? 'bg-gray-100 border-gray-300 text-[#121212]' : 'bg-white border-transparent text-gray-500 hover:bg-gray-50'"
                @click="toggleTableHeadings(index)"
              >
                <span>H</span> Header Baris
              </button>
              <button
                type="button"
                class="text-gray-500 hover:text-[#121212] transition-colors cursor-pointer"
                @click="distributeTableColumns(index)"
              >
                Ratakan Kolom
              </button>
              <button
                type="button"
                class="text-[#121212] border-b border-black font-medium transition-colors cursor-pointer ml-auto"
                @click="addTableColumn(index)"
              >
                + Kolom
              </button>
              <button
                type="button"
                class="text-[#121212] border-b border-black font-medium transition-colors cursor-pointer"
                @click="addTableRow(index)"
              >
                + Baris
              </button>
            </div>

            <!-- Table Scroll Container with visual gradient shadows -->
            <div class="relative w-full group/table-scroll-container">
              <!-- Left Scroll Shadow -->
              <div
                v-if="tableScrollStates[index]?.canScrollLeft"
                class="pointer-events-none absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-black/15 to-transparent z-20 transition-opacity"
              />
              <!-- Right Scroll Shadow -->
              <div
                v-if="tableScrollStates[index]?.canScrollRight"
                class="pointer-events-none absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-black/15 to-transparent z-20 transition-opacity"
              />

              <div
                class="w-full border border-gray-300 bg-white overflow-x-auto px-table-wrapper"
                @scroll="onTableScroll($event, index)"
              >
                <table class="border-collapse table-fixed w-full text-left" :style="{ minWidth: getTableTotalWidth(block) + 'px' }">
                  <colgroup>
                    <col
                      v-for="(_, cIdx) in (block.tableData.rows[0] || [])"
                      :key="cIdx"
                      :style="{ width: getColWidth(block, cIdx) + 'px' }"
                    />
                    <!-- Actions Column -->
                    <col style="width: 44px;" />
                  </colgroup>

                  <tbody>
                    <tr
                      v-for="(row, rIdx) in block.tableData.rows"
                      :key="rIdx"
                      class="group/row transition-colors border-b border-gray-200 last:border-b-0"
                      :class="{
                        'bg-gray-100 font-semibold text-[#121212] border-b-2 border-gray-400': rIdx === 0 && block.tableData.withHeadings,
                        'hover:bg-gray-50': !(rIdx === 0 && block.tableData.withHeadings)
                      }"
                    >
                      <!-- Data Cells -->
                      <td
                        v-for="(cell, cIdx) in row"
                        :key="cIdx"
                        class="relative overflow-visible px-3 py-2 text-sm text-[#121212] border-r border-gray-200 last:border-r-0 align-top group/cell"
                      >
                        <EditableArea
                          :ref="(el) => setTableCellRef(el, index, rIdx, cIdx)"
                          :model-value="cell"
                          :placeholder="rIdx === 0 && block.tableData.withHeadings ? `Header ${cIdx + 1}` : '...'"
                          :aria-label="`Sel tabel baris ${rIdx + 1} kolom ${cIdx + 1}`"
                          custom-class="min-h-[24px] outline-none text-sm leading-relaxed px-editable"
                          @update:model-value="updateTableCell(index, rIdx, cIdx, $event)"
                          @keydown="handleTableCellKeydown($event, index, rIdx, cIdx)"
                          @focus="setActiveBlock(index)"
                        />

                        <!-- Column Resizer Handle (16px hit target for mouse and touch) -->
                        <div
                          v-if="rIdx === 0"
                          class="absolute top-0 -right-2 w-4 h-full cursor-col-resize z-20 flex items-stretch justify-center group/resizer touch-none select-none"
                          title="Tarik untuk mengubah lebar kolom"
                          aria-label="Tarik untuk mengubah lebar kolom"
                          @mousedown.prevent.stop="startColResize(index, cIdx, $event)"
                          @touchstart.stop="startColResizeTouch(index, cIdx, $event)"
                        >
                          <div
                            class="w-[1.5px] bg-transparent transition-colors duration-150 group-hover/resizer:bg-[#5530AB] group-hover/resizer:w-[2px]"
                            :class="{ '!bg-[#5530AB] !w-[2px]': resizingCol?.blockIndex === index && resizingCol?.colIndex === cIdx }"
                          />
                        </div>

                        <!-- Column quick delete -->
                        <button
                          v-if="rIdx === 0 && (block.tableData.rows[0]?.length || 0) > 1"
                          type="button"
                          class="absolute top-1 right-1 opacity-0 group-hover/cell:opacity-100 p-0.5 text-gray-400 hover:text-[#121212] transition-opacity text-[10px] cursor-pointer"
                          title="Hapus kolom ini"
                          :aria-label="`Hapus kolom ke-${cIdx + 1}`"
                          @click.stop="deleteTableColumn(index, cIdx)"
                        >
                          ✕
                        </button>
                      </td>

                      <!-- Row Controls Cell (Rightmost) -->
                      <td class="relative overflow-visible w-11 px-1 py-1 text-center align-middle border-l border-gray-200 select-none">
                        <div class="flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition-opacity">
                          <button
                            type="button"
                            class="w-6 h-6 text-gray-400 hover:text-[#121212] flex items-center justify-center text-xs transition-colors cursor-pointer"
                            title="Hapus baris ini"
                            :aria-label="`Hapus baris ke-${rIdx + 1}`"
                            :disabled="block.tableData.rows.length <= 1"
                            @click="deleteTableRow(index, rIdx)"
                          >
                            ✕
                          </button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- Divider -->
          <div v-if="block.type === 'divider'" class="py-4 flex items-center justify-center select-none">
            <div class="w-full border-t border-gray-300" />
          </div>

          <!-- Image -->
          <div v-if="block.type === 'image'">
            <!-- No URL: Upload or input URL -->
            <div v-if="!block.url" class="p-6 border border-gray-300 bg-gray-50 hover:bg-gray-100 transition-colors text-center">
              <p class="text-sm font-semibold text-[#121212] mb-1">Tambah Gambar</p>
              
              <div class="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto mt-4">
                <label class="px-4 py-2 bg-[#121212] hover:bg-black text-white text-xs font-medium cursor-pointer transition-colors">
                  Pilih Berkas
                  <input type="file" accept="image/*" class="hidden" @change="onImageFileChosen($event, index)" />
                </label>
                <span class="text-xs text-gray-400">atau</span>
                <input
                  v-model="imageUrlInputs[index]"
                  type="url"
                  placeholder="Paste URL gambar..."
                  class="px-3 py-1.5 text-xs bg-white border border-gray-300 outline-none focus:border-[#121212] flex-1 w-full"
                  @keydown.enter.prevent="applyImageUrl(index)"
                />
                <button
                  v-if="imageUrlInputs[index]"
                  type="button"
                  class="px-3 py-1.5 bg-gray-200 text-[#121212] text-xs font-medium hover:bg-gray-300 cursor-pointer"
                  @click="applyImageUrl(index)"
                >
                  OK
                </button>
              </div>
            </div>

            <!-- Image preview -->
            <div v-else class="space-y-2">
              <div class="relative border border-gray-200 bg-gray-50 group/img">
                <img :src="block.url" :alt="block.caption || 'Gambar lesson'" class="w-full max-h-[460px] object-contain" />
                
                <!-- Floating action buttons -->
                <div class="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover/img:opacity-100 transition-opacity">
                  <button
                    type="button"
                    class="px-2 py-1 bg-white border border-gray-300 hover:bg-gray-100 text-[#121212] text-xs transition-colors cursor-pointer"
                    title="Ganti gambar"
                    @click="block.url = ''; emitChanges()"
                  >
                    Ganti
                  </button>
                  <button
                    type="button"
                    class="px-2 py-1 bg-white border border-gray-300 hover:bg-gray-100 text-[#121212] text-xs transition-colors cursor-pointer"
                    title="Hapus gambar"
                    @click="deleteBlock(index)"
                  >
                    Hapus
                  </button>
                </div>
              </div>

              <!-- Caption input -->
              <input
                :value="block.caption || ''"
                type="text"
                placeholder="Tambahkan keterangan gambar (opsional)..."
                class="w-full text-center text-xs text-gray-500 bg-transparent outline-none border-b border-transparent focus:border-gray-300 py-1"
                @input="updateCaption(index, ($event.target as HTMLInputElement).value)"
              />
            </div>
          </div>

          <!-- Web Bookmark -->
          <div v-if="block.type === 'bookmark'">
            <!-- No URL yet: input URL -->
            <div v-if="!block.url" class="p-6 border border-gray-300 bg-gray-50 hover:bg-gray-100/60 transition-colors text-center">
              <p class="text-sm font-semibold text-[#121212] mb-1">Tambah Web Bookmark</p>
              <p class="text-xs text-gray-500 mb-4">Tempelkan tautan website atau artikel untuk membuat kartu tautan interaktif otomatis</p>

              <div class="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
                <input
                  v-model="bookmarkUrlInputs[index]"
                  type="url"
                  placeholder="Paste URL (contoh: https://wikipedia.org)..."
                  aria-label="Masukkan URL tautan web"
                  class="px-3 py-1.5 text-xs bg-white border border-gray-300 outline-none focus:border-[#5530AB] flex-1 w-full"
                  @keydown.enter.prevent="applyBookmarkUrl(index)"
                />
                <button
                  type="button"
                  class="px-4 py-1.5 bg-[#121212] hover:bg-black text-white text-xs font-medium cursor-pointer transition-colors shrink-0 w-full sm:w-auto flex items-center justify-center gap-1.5"
                  aria-label="Sematkan tautan web bookmark"
                  :disabled="isFetchingMetadata[index]"
                  @click="applyBookmarkUrl(index)"
                >
                  <span v-if="isFetchingMetadata[index]" class="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>{{ isFetchingMetadata[index] ? 'Memuat...' : 'Sematkan' }}</span>
                </button>
              </div>
            </div>

            <!-- Bookmark Card Preview -->
            <div v-else class="space-y-2 group/bookmark relative">
              <!-- Loading overlay while updating metadata -->
              <div
                v-if="isFetchingMetadata[index]"
                class="absolute inset-0 z-20 bg-white/70 backdrop-blur-[1px] flex items-center justify-center gap-2 text-xs font-medium text-[#5530AB]"
              >
                <div class="w-4 h-4 border-2 border-[#5530AB] border-t-transparent rounded-full animate-spin" />
                <span>Mengambil data judul & deskripsi web...</span>
              </div>

              <a
                :href="block.url"
                target="_blank"
                rel="noopener noreferrer"
                class="flex flex-col sm:flex-row items-stretch justify-between border border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 transition-colors overflow-hidden text-left no-underline block"
                aria-label="Buka web bookmark"
                @click.stop
              >
                <div class="p-4 flex-1 min-w-0 flex flex-col justify-between gap-3">
                  <div class="space-y-1">
                    <input
                      :value="block.bookmarkData?.title || getUrlHostname(block.url)"
                      placeholder="Judul tautan..."
                      aria-label="Judul web bookmark"
                      class="w-full text-sm font-semibold text-[#121212] bg-transparent outline-none border-b border-transparent hover:border-gray-300 focus:border-[#5530AB] transition-colors py-0.5"
                      @input="updateBookmarkTitle(index, ($event.target as HTMLInputElement).value)"
                      @click.stop.prevent
                    />
                    <input
                      :value="block.bookmarkData?.description || 'Kunjungi situs web untuk informasi lebih lanjut.'"
                      placeholder="Deskripsi ringkas..."
                      aria-label="Deskripsi web bookmark"
                      class="w-full text-xs text-gray-500 bg-transparent outline-none border-b border-transparent hover:border-gray-300 focus:border-[#5530AB] transition-colors py-0.5 truncate"
                      @input="updateBookmarkDesc(index, ($event.target as HTMLInputElement).value)"
                      @click.stop.prevent
                    />
                  </div>

                  <div class="flex items-center gap-2 text-xs text-gray-600 pt-1">
                    <img
                      :src="getFaviconUrl(block.url)"
                      alt=""
                      class="w-4 h-4 object-contain shrink-0"
                      @error="(e) => ((e.target as HTMLElement).style.display = 'none')"
                    />
                    <span class="truncate font-mono text-[0.725rem] text-gray-600">{{ getUrlHostname(block.url) }}</span>
                    <span class="text-gray-400">↗</span>
                  </div>
                </div>

                <div class="hidden sm:flex items-center justify-center w-28 bg-gray-50 border-l border-gray-200 text-gray-400 select-none shrink-0">
                  <svg class="w-6 h-6 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                  </svg>
                </div>
              </a>

              <!-- Floating action buttons -->
              <div class="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover/bookmark:opacity-100 transition-opacity z-10">
                <a
                  :href="block.url"
                  target="_blank"
                  class="px-2 py-1 bg-white border border-gray-300 hover:bg-gray-100 text-[#121212] text-xs transition-colors cursor-pointer"
                  title="Buka tautan di tab baru"
                  @click.stop
                >
                  Buka ↗
                </a>
                <button
                  type="button"
                  class="px-2 py-1 bg-white border border-gray-300 hover:bg-gray-100 text-[#121212] text-xs transition-colors cursor-pointer"
                  title="Ganti URL tautan"
                  @click="block.url = ''; emitChanges()"
                >
                  Ganti
                </button>
                <button
                  type="button"
                  class="px-2 py-1 bg-white border border-gray-300 hover:bg-gray-100 text-[#121212] text-xs transition-colors cursor-pointer"
                  title="Hapus bookmark"
                  @click="deleteBlock(index)"
                >
                  Hapus
                </button>
              </div>

              <!-- Caption -->
              <input
                :value="block.caption || ''"
                type="text"
                placeholder="Tambahkan catatan tautan (opsional)..."
                class="w-full text-center text-xs text-gray-500 bg-transparent outline-none border-b border-transparent focus:border-gray-300 py-1"
                @input="updateCaption(index, ($event.target as HTMLInputElement).value)"
              />
            </div>
          </div>

          <!-- Canva Embed Slides -->
          <div v-if="block.type === 'canva'">
            <!-- No URL yet: input URL -->
            <div v-if="!block.url" class="p-6 border border-gray-300 bg-gray-50 hover:bg-gray-100/60 transition-colors text-center space-y-2">
              <p class="text-sm font-semibold text-[#121212]">Sematkan Slide Canva</p>
              <p class="text-xs text-gray-500 max-w-md mx-auto">
                Tempelkan tautan atau kode embed Canva. Siswa dapat melihat dan menavigasi slide presentasi secara interaktif.
              </p>

              <div class="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto pt-2">
                <input
                  v-model="canvaUrlInputs[index]"
                  type="text"
                  placeholder="Paste URL Canva atau kode embed iframe..."
                  aria-label="Masukkan URL atau kode embed Canva"
                  class="px-3 py-1.5 text-xs bg-white border border-gray-300 outline-none focus:border-[#5530AB] flex-1 w-full"
                  @keydown.enter.prevent="applyCanvaUrl(index)"
                />
                <button
                  type="button"
                  class="px-4 py-1.5 bg-[#121212] hover:bg-black text-white text-xs font-medium cursor-pointer transition-colors shrink-0 w-full sm:w-auto"
                  aria-label="Sematkan slide Canva"
                  @click="applyCanvaUrl(index)"
                >
                  Sematkan
                </button>
              </div>
              <p class="text-[0.6875rem] text-gray-400">
                Di Canva: Klik Bagikan > Lainnya > Sematkan (Embed) > Salin Tautan Sematan Pintar.
              </p>
            </div>

            <!-- Canva Preview Iframe -->
            <div v-else class="space-y-2 group/canva relative">
              <div class="relative w-full aspect-video border border-gray-300 bg-black overflow-hidden">
                <iframe
                  :src="block.url"
                  class="w-full h-full border-0"
                  allowfullscreen="true"
                  allow="fullscreen"
                  loading="lazy"
                  title="Slide Canva"
                />

                <!-- Floating action buttons -->
                <div class="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover/canva:opacity-100 transition-opacity z-10">
                  <a
                    :href="block.url.replace(/[\?&]embed/g, '')"
                    target="_blank"
                    class="px-2 py-1 bg-white border border-gray-300 hover:bg-gray-100 text-[#121212] text-xs transition-colors cursor-pointer"
                    title="Buka presentasi di Canva"
                    aria-label="Buka presentasi di Canva"
                    @click.stop
                  >
                    Buka di Canva ↗
                  </a>
                  <button
                    type="button"
                    class="px-2 py-1 bg-white border border-gray-300 hover:bg-gray-100 text-[#121212] text-xs transition-colors cursor-pointer"
                    title="Ganti tautan Canva"
                    aria-label="Ganti tautan Canva"
                    @click="block.url = ''; emitChanges()"
                  >
                    Ganti
                  </button>
                  <button
                    type="button"
                    class="px-2 py-1 bg-white border border-gray-300 hover:bg-gray-100 text-[#121212] text-xs transition-colors cursor-pointer"
                    title="Hapus slide"
                    aria-label="Hapus blok slide Canva"
                    @click="deleteBlock(index)"
                  >
                    Hapus
                  </button>
                </div>
              </div>

              <!-- Caption -->
              <input
                :value="block.caption || ''"
                type="text"
                placeholder="Tambahkan keterangan slide Canva (opsional)..."
                class="w-full text-center text-xs text-gray-500 bg-transparent outline-none border-b border-transparent focus:border-gray-300 py-1"
                @input="updateCaption(index, ($event.target as HTMLInputElement).value)"
              />
            </div>
          </div>
        </div>

        <!-- Drop target line indicator -->
        <div v-if="dropTargetIndex === index" class="absolute -bottom-[2px] left-0 right-0 h-[2px] bg-[#121212]" />
      </div>

      <!-- Bottom Clickable Area to append new block -->
      <div
        class="h-28 cursor-text flex items-start pt-2 text-xs text-gray-300 hover:text-gray-400 transition-colors"
        @click="focusOrCreateEndBlock"
      >
        <span>Klik di sini untuk menulis baris baru...</span>
      </div>
    </div>

    <!-- ── Interactive Marquee Selection Box (Rubberband Rectangle) ── -->
    <Teleport to="body">
      <div
        v-if="marquee.active && (marqueeBox.width > 3 || marqueeBox.height > 3)"
        class="fixed pointer-events-none z-[99999] border border-[#121212]/50 bg-[#121212]/5"
        :style="{
          left: marqueeBox.left + 'px',
          top: marqueeBox.top + 'px',
          width: marqueeBox.width + 'px',
          height: marqueeBox.height + 'px'
        }"
      />
    </Teleport>

    <!-- ── Floating Multi-Block Selection Toolbar (Batch Actions) ── -->
    <Teleport to="body">
      <div
        v-if="selectedBlockIndices.size > 0"
        class="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-3 px-4 py-2 bg-white text-[#121212] border border-gray-300 shadow-md select-none"
      >
        <span class="text-xs font-semibold text-gray-500">
          {{ selectedBlockIndices.size }} Blok Terpilih
        </span>
        <div class="w-px h-4 bg-gray-300" />
        <button
          type="button"
          class="text-xs font-medium text-gray-600 hover:text-[#121212] cursor-pointer"
          @click="duplicateSelectedBlocks"
        >
          Duplikat
        </button>
        <button
          type="button"
          class="text-xs font-medium text-gray-600 hover:text-[#121212] cursor-pointer"
          @click="copySelectedBlocks"
        >
          Salin
        </button>
        <button
          type="button"
          class="text-xs font-medium text-gray-600 hover:text-[#121212] cursor-pointer"
          @click="openBatchTypeSelector"
        >
          Ubah Tipe
        </button>
        <div class="w-px h-4 bg-gray-300" />
        <button
          type="button"
          class="text-xs font-medium text-[#121212] cursor-pointer"
          @click="deleteSelectedBlocks"
        >
          Hapus
        </button>
        <button
          type="button"
          class="text-gray-400 hover:text-[#121212] cursor-pointer pl-2"
          @click="clearBlockSelection"
        >
          ✕
        </button>
      </div>
    </Teleport>

    <!-- ── Popover: Slash Command / Add Block / Turn Into Selector ── -->
    <Teleport to="body">
      <div
        v-if="blockMenu.open"
        ref="menuRef"
        role="menu"
        aria-label="Menu pemilihan tipe blok"
        class="fixed z-[9999] w-64 bg-white border border-gray-300 shadow-xl rounded-lg overflow-hidden"
        :style="{ top: blockMenu.top + 'px', left: blockMenu.left + 'px' }"
        @mousedown.stop
      >
        <!-- Header Mode Indicator -->
        <div class="px-3 py-2 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
          <span class="text-[0.6875rem] font-bold text-gray-600 uppercase tracking-wider">
            {{ blockMenu.mode === 'turnInto' ? 'Ubah Tipe Blok' : blockMenu.mode === 'insertBelow' ? 'Tambah Blok di Bawah' : blockMenu.mode === 'batchChange' ? 'Ubah Tipe Terpilih' : 'Pilih Jenis Blok' }}
          </span>
          <button
            type="button"
            class="text-gray-400 hover:text-gray-700 text-xs p-0.5 rounded cursor-pointer"
            aria-label="Tutup menu blok"
            @click="closeBlockMenu"
          >
            ✕
          </button>
        </div>

        <!-- Search input -->
        <div class="p-2 border-b border-gray-200">
          <input
            ref="menuSearchInput"
            v-model="blockMenu.search"
            type="text"
            placeholder="Ketik untuk mencari blok (fuzzy)..."
            aria-label="Cari jenis blok"
            class="w-full px-2 py-1.5 text-xs bg-gray-50 rounded outline-none focus:bg-white border border-transparent focus:border-[#5530AB] text-[#121212] transition-colors"
            @keydown.down.prevent="navigateMenu(1)"
            @keydown.up.prevent="navigateMenu(-1)"
            @keydown.enter.prevent="selectCurrentMenuItem"
            @keydown.escape.prevent="closeBlockMenu"
          />
        </div>

        <!-- Block types list -->
        <div class="max-h-64 overflow-y-auto p-1 space-y-[2px] custom-scrollbar">
          <div v-if="filteredMenuItems.length === 0" class="p-3 text-center text-xs text-gray-400">
            Tidak ditemukan tipe yang cocok
          </div>
          <button
            v-for="(item, itemIdx) in filteredMenuItems"
            :key="item.type"
            type="button"
            role="menuitem"
            :aria-label="`Pilih tipe ${item.title}`"
            class="w-full flex items-center gap-3 px-2.5 py-1.5 rounded-md text-left cursor-pointer transition-colors"
            :class="blockMenu.selectedIndex === itemIdx ? 'bg-[#5530AB]/10 text-[#5530AB] font-medium' : 'hover:bg-gray-100 text-[#121212]'"
            @click="applyBlockType(item.type)"
            @mouseenter="blockMenu.selectedIndex = itemIdx"
          >
            <div class="w-6 h-6 flex items-center justify-center font-medium text-xs text-gray-600 border border-gray-200 rounded shrink-0 bg-white shadow-2xs">
              {{ item.badge }}
            </div>
            <div class="min-w-0 flex-1">
              <p class="text-xs">{{ item.title }}</p>
            </div>
          </button>
        </div>
      </div>
    </Teleport>

    <!-- ── Popover: Block Tunes (⋮⋮ menu) ── -->
    <Teleport to="body">
      <div
        v-if="tuneMenu.open"
        ref="tuneMenuRef"
        role="menu"
        aria-label="Menu aksi blok"
        class="fixed z-[9999] w-52 bg-white border border-gray-300 shadow-xl rounded-lg p-1 space-y-[2px]"
        :style="{ top: tuneMenu.top + 'px', left: tuneMenu.left + 'px' }"
        @mousedown.stop
        @click.stop
      >
        <button
          type="button"
          role="menuitem"
          class="w-full text-left px-2.5 py-1.5 text-xs text-[#121212] hover:bg-gray-100 rounded transition-colors cursor-pointer"
          @click="toggleSelectCurrentBlock(tuneMenu.blockIndex)"
        >
          {{ selectedBlockIndices.has(tuneMenu.blockIndex) ? 'Batal Pilih' : 'Pilih Blok Ini' }}
        </button>
        <div class="border-t border-gray-100 my-1" />
        <button
          type="button"
          role="menuitem"
          class="w-full flex items-center justify-between text-left px-2.5 py-1.5 text-xs text-[#5530AB] font-semibold hover:bg-[#5530AB]/10 rounded transition-colors cursor-pointer"
          @click="openTurnIntoMenu(tuneMenu.blockIndex)"
        >
          <span>Ubah Tipe (Turn into)...</span>
          <span class="text-[0.65rem] text-gray-400">→</span>
        </button>
        <button
          type="button"
          role="menuitem"
          class="w-full text-left px-2.5 py-1.5 text-xs text-[#121212] hover:bg-gray-100 rounded transition-colors cursor-pointer"
          @click="copyCurrentBlock(tuneMenu.blockIndex)"
        >
          Salin Blok (Copy)
        </button>
        <button
          type="button"
          role="menuitem"
          class="w-full text-left px-2.5 py-1.5 text-xs text-[#121212] hover:bg-gray-100 rounded transition-colors cursor-pointer"
          @click="duplicateBlock(tuneMenu.blockIndex)"
        >
          Duplikat
        </button>
        <button
          v-if="tuneMenu.blockIndex > 0"
          type="button"
          role="menuitem"
          class="w-full flex items-center justify-between text-left px-2.5 py-1.5 text-xs text-[#121212] hover:bg-gray-100 rounded transition-colors cursor-pointer"
          @click="moveBlock(tuneMenu.blockIndex, -1)"
        >
          <span>Pindah ke Atas</span>
          <span class="text-[0.625rem] text-gray-400 font-mono">Alt+↑</span>
        </button>
        <button
          v-if="tuneMenu.blockIndex < blocks.length - 1"
          type="button"
          role="menuitem"
          class="w-full flex items-center justify-between text-left px-2.5 py-1.5 text-xs text-[#121212] hover:bg-gray-100 rounded transition-colors cursor-pointer"
          @click="moveBlock(tuneMenu.blockIndex, 1)"
        >
          <span>Pindah ke Bawah</span>
          <span class="text-[0.625rem] text-gray-400 font-mono">Alt+↓</span>
        </button>
        <div class="border-t border-gray-100 my-1" />
        <button
          type="button"
          role="menuitem"
          class="w-full text-left px-2.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer font-medium"
          @click="deleteBlock(tuneMenu.blockIndex); closeTuneMenu()"
        >
          Hapus Blok
        </button>
      </div>
    </Teleport>

    <!-- ── Floating Inline Formatting Toolbar (Selection) ── -->
    <Teleport to="body">
      <div
        v-if="inlineToolbar.show"
        role="toolbar"
        aria-label="Toolbar format teks"
        class="fixed z-[9999] flex items-center gap-1 p-1 bg-white border border-gray-300 shadow-md rounded-md select-none"
        :style="{ top: inlineToolbar.top + 'px', left: inlineToolbar.left + 'px' }"
        @mousedown.prevent
      >
        <button
          type="button"
          class="px-2 py-1 text-xs font-bold text-[#121212] hover:bg-gray-100 rounded cursor-pointer"
          title="Tebal (Ctrl+B)"
          aria-label="Format tebal"
          @click="execFormat('bold')"
        >
          B
        </button>
        <button
          type="button"
          class="px-2 py-1 text-xs italic font-serif text-[#121212] hover:bg-gray-100 rounded cursor-pointer"
          title="Miring (Ctrl+I)"
          aria-label="Format miring"
          @click="execFormat('italic')"
        >
          I
        </button>
        <button
          type="button"
          class="px-2 py-1 text-xs underline text-[#121212] hover:bg-gray-100 rounded cursor-pointer"
          title="Garis Bawah (Ctrl+U)"
          aria-label="Format garis bawah"
          @click="execFormat('underline')"
        >
          U
        </button>
        <button
          type="button"
          class="px-2 py-1 text-xs line-through text-[#121212] hover:bg-gray-100 rounded cursor-pointer"
          title="Coret"
          aria-label="Format coret"
          @click="execFormat('strikeThrough')"
        >
          S
        </button>
        <div class="w-px h-4 bg-gray-300 mx-1" />
        <button
          type="button"
          class="px-2 py-1 text-xs font-mono text-gray-600 hover:text-[#121212] hover:bg-gray-100 rounded cursor-pointer"
          title="Kode Inline"
          aria-label="Format kode inline"
          @click="formatInlineCode"
        >
          &lt;/&gt;
        </button>
        <button
          type="button"
          class="px-2 py-1 text-xs text-gray-600 hover:text-[#121212] hover:bg-gray-100 rounded cursor-pointer"
          title="Tautan Link"
          aria-label="Sisipkan tautan"
          @click="formatLink"
        >
          Link
        </button>
      </div>
    </Teleport>

    <!-- ── Toast Notification ── -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition ease-out duration-200"
        enter-from-class="opacity-0 translate-y-2"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition ease-in duration-150"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 translate-y-2"
      >
        <div
          v-if="editorToast.show"
          class="fixed bottom-6 right-6 z-[99999] flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-900 text-white text-xs font-medium shadow-2xl border border-gray-700 pointer-events-none"
        >
          <span
            class="w-2 h-2 rounded-full shrink-0"
            :class="editorToast.type === 'error' ? 'bg-rose-400' : 'bg-emerald-400'"
          />
          <span>{{ editorToast.message }}</span>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import EditableArea from './EditableArea.vue'

// ── Types ──────────────────────────────────────────────────────────
export interface TableData {
  rows: string[][]
  withHeadings?: boolean
  colWidths?: number[]
}

export interface BookmarkData {
  url: string
  title?: string
  description?: string
  favicon?: string
}

export interface Block {
  id: string
  type: 'heading1' | 'heading2' | 'heading3' | 'paragraph' | 'code' | 'quote' | 'callout' | 'bulletList' | 'numberedList' | 'divider' | 'image' | 'table' | 'bookmark' | 'canva'
  content?: string
  language?: string
  items?: string[]
  url?: string
  caption?: string
  tableData?: TableData
  bookmarkData?: BookmarkData
}

const props = defineProps<{
  modelValue: Block[]
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', blocks: Block[]): void
}>()

// ── State ──────────────────────────────────────────────────────────
const blocks = ref<Block[]>([])
const activeBlockIndex = ref<number>(0)
const copiedBlockIndex = ref<number | null>(null)
const imageUrlInputs = reactive<Record<number, string>>({})
const bookmarkUrlInputs = reactive<Record<number, string>>({})
const canvaUrlInputs = reactive<Record<number, string>>({})

// Multi-block selection state
const selectedBlockIndices = ref<Set<number>>(new Set())

// Marquee (Rubberband rectangle) selection state
const marquee = reactive({
  active: false,
  startX: 0,
  startY: 0,
  currentX: 0,
  currentY: 0,
})

let isPotentialMarquee = false
let dragOriginX = 0
let dragOriginY = 0
let justFinishedMarquee = false

const marqueeBox = computed(() => {
  const left = Math.min(marquee.startX, marquee.currentX)
  const top = Math.min(marquee.startY, marquee.currentY)
  const width = Math.abs(marquee.currentX - marquee.startX)
  const height = Math.abs(marquee.currentY - marquee.startY)
  return { left, top, width, height, right: left + width, bottom: top + height }
})

// References to EditableArea components
const editableRefs = ref<Record<number, any>>({})
const listEditableRefs = ref<Record<string, any>>({})

function setEditableRef(el: any, index: number) {
  if (el) editableRefs.value[index] = el
}

function setListEditableRef(el: any, blockIndex: number, itemIndex: number) {
  if (el) listEditableRefs.value[`${blockIndex}-${itemIndex}`] = el
}

// Drag & drop state for smooth reordering
const draggingIndex = ref<number | null>(null)
const dropTargetIndex = ref<number | null>(null)
const dropPosition = ref<'before' | 'after'>('after')

// Editor Toast notification
const editorToast = reactive({
  show: false,
  message: '',
  type: 'info' as 'info' | 'error'
})
let toastTimer: ReturnType<typeof setTimeout> | null = null
function showEditorToast(message: string, type: 'info' | 'error' = 'info') {
  if (toastTimer) clearTimeout(toastTimer)
  editorToast.message = message
  editorToast.type = type
  editorToast.show = true
  toastTimer = setTimeout(() => {
    editorToast.show = false
  }, 2500)
}

// Bookmark metadata loading state
const isFetchingMetadata = reactive<Record<number, boolean>>({})

// Table horizontal scroll shadow indicators
const tableScrollStates = reactive<Record<number, { canScrollLeft: boolean; canScrollRight: boolean }>>({})
function onTableScroll(ev: Event, blockIdx: number) {
  const el = ev.currentTarget as HTMLElement
  if (!el) return
  tableScrollStates[blockIdx] = {
    canScrollLeft: el.scrollLeft > 4,
    canScrollRight: el.scrollLeft + el.clientWidth < el.scrollWidth - 4
  }
}

// Popover: Slash command & Add block menu
const menuRef = ref<HTMLElement | null>(null)
const menuSearchInput = ref<HTMLInputElement | null>(null)
const blockMenu = reactive({
  open: false,
  targetIndex: 0,
  mode: 'insertBelow' as 'insertBelow' | 'turnInto' | 'slashCommand' | 'batchChange',
  search: '',
  selectedIndex: 0,
  top: 0,
  left: 0,
})

// Popover: Block tunes menu
const tuneMenuRef = ref<HTMLElement | null>(null)
const tuneMenu = reactive({
  open: false,
  blockIndex: 0,
  top: 0,
  left: 0,
})

// Floating selection toolbar
const inlineToolbar = reactive({
  show: false,
  top: 0,
  left: 0,
})

// Code languages
const codeLanguages = [
  'javascript', 'typescript', 'html', 'css', 'python', 'java', 'c', 'cpp',
  'csharp', 'php', 'sql', 'bash', 'json', 'yaml', 'markdown', 'plaintext'
]

// Block menu catalog with aliases/keywords for robust fuzzy search
const menuCatalog = [
  { type: 'paragraph', badge: '¶', title: 'Teks Biasa', keywords: ['teks', 'text', 'paragraf', 'paragraph', 'p', 'tulisan', 'biasa', 'normal'] },
  { type: 'heading1', badge: 'H1', title: 'Heading 1', keywords: ['h1', 'judul', 'besar', 'header', 'title', 'heading', 'utama'] },
  { type: 'heading2', badge: 'H2', title: 'Heading 2', keywords: ['h2', 'subjudul', 'subtitle', 'header 2', 'sedang'] },
  { type: 'heading3', badge: 'H3', title: 'Heading 3', keywords: ['h3', 'section', 'header 3', 'kecil', 'sub'] },
  { type: 'bulletList', badge: '•', title: 'Bullet List', keywords: ['bullet', 'list', 'daftar', 'poin', 'bulleted', 'titik'] },
  { type: 'numberedList', badge: '1.', title: 'Numbered List', keywords: ['number', 'nomor', 'angka', 'urut', 'list', 'daftar'] },
  { type: 'quote', badge: '"', title: 'Kutipan', keywords: ['quote', 'kutipan', 'petik', 'blockquote', 'saying'] },
  { type: 'callout', badge: '💡', title: 'Callout Box', keywords: ['callout', 'info', 'note', 'catatan', 'tips', 'warning', 'kotak', 'box'] },
  { type: 'table', badge: 'T', title: 'Tabel Data', keywords: ['table', 'tabel', 'grid', 'kolom', 'baris', 'spreadsheet', 'matrix'] },
  { type: 'code', badge: '</>', title: 'Blok Kode', keywords: ['code', 'kode', 'coding', 'script', 'program', 'snippet', 'syntax'] },
  { type: 'bookmark', badge: '🔖', title: 'Web Bookmark', keywords: ['bookmark', 'link', 'tautan', 'url', 'web', 'preview', 'site'] },
  { type: 'canva', badge: '🎨', title: 'Slide Canva', keywords: ['canva', 'slide', 'presentasi', 'presentation', 'embed', 'deck', 'slides'] },
  { type: 'divider', badge: '—', title: 'Garis Pemisah', keywords: ['divider', 'garis', 'line', 'separator', 'pemisah', 'hr', 'break'] },
  { type: 'image', badge: 'IMG', title: 'Gambar', keywords: ['image', 'gambar', 'foto', 'photo', 'picture', 'upload', 'img'] },
]

// Fuzzy matching logic: checks direct substring or ordered character sequence (subsequence)
function fuzzyMatch(text: string, query: string): boolean {
  text = text.toLowerCase()
  query = query.toLowerCase()
  if (text.includes(query)) return true
  let tIdx = 0
  for (let qIdx = 0; qIdx < query.length; qIdx++) {
    const char = query[qIdx]
    tIdx = text.indexOf(char, tIdx)
    if (tIdx === -1) return false
    tIdx++
  }
  return true
}

const filteredMenuItems = computed(() => {
  const q = blockMenu.search.trim().toLowerCase()
  if (!q) return menuCatalog
  return menuCatalog.filter(item => {
    if (fuzzyMatch(item.title, q) || fuzzyMatch(item.type, q)) return true
    return item.keywords?.some(kw => fuzzyMatch(kw, q))
  })
})

// ── Helpers ────────────────────────────────────────────────────────
function genId(): string {
  return 'b_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36)
}

function createEmptyBlock(type: Block['type'] = 'paragraph'): Block {
  const b: Block = { id: genId(), type, content: '' }
  if (type === 'bulletList' || type === 'numberedList') b.items = ['']
  if (type === 'code') { b.language = 'javascript'; b.content = '' }
  if (type === 'table') {
    b.tableData = {
      withHeadings: true,
      colWidths: [140, 200, 280],
      rows: [
        ['Header 1', 'Header 2', 'Header 3'],
        ['', '', ''],
        ['', '', ''],
      ]
    }
  }
  if (type === 'bookmark') {
    b.url = ''
    b.bookmarkData = { url: '', title: '', description: '' }
  }
  if (type === 'canva') {
    b.url = ''
  }
  return b
}

function clone(data: any): any {
  return JSON.parse(JSON.stringify(data))
}

// ── Lifecycle & Sync ───────────────────────────────────────────────
onMounted(() => {
  if (props.modelValue && props.modelValue.length > 0) {
    blocks.value = clone(props.modelValue)
    const converted = migrateTablesFromContent(blocks.value)
    if (converted) emitChanges()
  } else {
    blocks.value = [createEmptyBlock('paragraph')]
  }

  document.addEventListener('selectionchange', handleSelectionChange)
  document.addEventListener('click', handleGlobalClick)
  document.addEventListener('keydown', handleGlobalKeyDown)
  window.addEventListener('mousedown', handleGlobalMouseDown)
  window.addEventListener('mousemove', handleGlobalMouseMove)
  window.addEventListener('mouseup', handleGlobalMouseUp)
})

onBeforeUnmount(() => {
  document.removeEventListener('selectionchange', handleSelectionChange)
  document.removeEventListener('click', handleGlobalClick)
  document.removeEventListener('keydown', handleGlobalKeyDown)
  window.removeEventListener('mousedown', handleGlobalMouseDown)
  window.removeEventListener('mousemove', handleGlobalMouseMove)
  window.removeEventListener('mouseup', handleGlobalMouseUp)
})

let isInternalChange = false
watch(
  () => props.modelValue,
  (newVal) => {
    if (isInternalChange) return
    if (!newVal || newVal.length === 0) {
      blocks.value = [createEmptyBlock('paragraph')]
      return
    }
    const currentIds = blocks.value.map(b => b.id).join(',')
    const newIds = newVal.map(b => b.id).join(',')
    if (currentIds !== newIds) {
      blocks.value = clone(newVal)
      migrateTablesFromContent(blocks.value)
    }
  },
  { deep: false }
)

function emitChanges() {
  isInternalChange = true
  emit('update:modelValue', clone(blocks.value))
  nextTick(() => { isInternalChange = false })
}

// ── Marquee Selection Box (Kotak Seleksi Drag Dari Mana Saja) ─────
function handleGlobalMouseDown(e: MouseEvent) {
  if (e.button !== 0) return

  const target = e.target as HTMLElement
  if (
    target.closest('.editor-metadata-sidebar') ||
    target.closest('.editor-topbar') ||
    target.closest('.canvas-title-input') ||
    target.closest('.px-block-menu') ||
    target.closest('.px-inline-toolbar') ||
    target.closest('button, select, textarea, input, .px-code-textarea')
  ) {
    return
  }

  if (target.closest('.px-editable') && !e.shiftKey) {
    if (selectedBlockIndices.value.size > 0) {
      clearBlockSelection()
    }
    return
  }

  dragOriginX = e.clientX
  dragOriginY = e.clientY
  isPotentialMarquee = true
}

function handleGlobalMouseMove(e: MouseEvent) {
  if (!isPotentialMarquee) return
  const dx = e.clientX - dragOriginX
  const dy = e.clientY - dragOriginY
  const dist = Math.hypot(dx, dy)

  if (!marquee.active && dist > 4) {
    marquee.active = true
    marquee.startX = dragOriginX
    marquee.startY = dragOriginY
    window.getSelection()?.removeAllRanges()
  }

  if (marquee.active) {
    marquee.currentX = e.clientX
    marquee.currentY = e.clientY
    checkMarqueeIntersections()
  }
}

function handleGlobalMouseUp() {
  isPotentialMarquee = false
  if (marquee.active) {
    marquee.active = false
    justFinishedMarquee = true
    setTimeout(() => { justFinishedMarquee = false }, 250)
  }
}

function checkMarqueeIntersections() {
  const box = marqueeBox.value
  const rows = document.querySelectorAll<HTMLElement>('.group\\/row')
  const newSelection = new Set<number>()

  rows.forEach((row) => {
    const idxAttr = row.getAttribute('data-block-index')
    if (idxAttr === null) return
    const index = parseInt(idxAttr, 10)
    const rect = row.getBoundingClientRect()

    const verticalOverlap = !(rect.bottom < box.top || rect.top > box.bottom)
    const horizontalOverlap = !(
      (rect.right + 180) < box.left ||
      (rect.left - 180) > box.right
    )

    if (verticalOverlap && horizontalOverlap) {
      newSelection.add(index)
    }
  })

  selectedBlockIndices.value = newSelection
}

// ── Multi-Block Selection (Nge-block Elemen-Elemen) ────────────────
function clearBlockSelection() {
  selectedBlockIndices.value.clear()
}

function toggleSelectCurrentBlock(index: number) {
  if (selectedBlockIndices.value.has(index)) {
    selectedBlockIndices.value.delete(index)
  } else {
    selectedBlockIndices.value.add(index)
  }
  closeTuneMenu()
}

function onRowClick(ev: MouseEvent, index: number) {
  if (justFinishedMarquee) return

  if (ev.shiftKey) {
    ev.preventDefault()
    const start = activeBlockIndex.value
    const min = Math.min(start, index)
    const max = Math.max(start, index)
    selectedBlockIndices.value.clear()
    for (let i = min; i <= max; i++) {
      selectedBlockIndices.value.add(i)
    }
  }
}

function deleteSelectedBlocks() {
  if (selectedBlockIndices.value.size === 0) return
  const indices = Array.from(selectedBlockIndices.value).sort((a, b) => a - b)
  const firstIndex = indices[0]

  for (let i = indices.length - 1; i >= 0; i--) {
    blocks.value.splice(indices[i], 1)
  }

  if (blocks.value.length === 0) {
    blocks.value = [createEmptyBlock('paragraph')]
  }

  clearBlockSelection()
  emitChanges()
  nextTick(() => focusBlock(Math.min(firstIndex, blocks.value.length - 1)))
}

function duplicateSelectedBlocks() {
  if (selectedBlockIndices.value.size === 0) return
  const indices = Array.from(selectedBlockIndices.value).sort((a, b) => a - b)
  const lastIndex = indices[indices.length - 1]
  const duplicates = indices.map(idx => {
    const d = clone(blocks.value[idx])
    d.id = genId()
    return d
  })

  blocks.value.splice(lastIndex + 1, 0, ...duplicates)
  clearBlockSelection()
  emitChanges()
  nextTick(() => focusBlock(lastIndex + 1))
}

function serializeBlocks(blockList: Block[]): string {
  return JSON.stringify({
    __pixelnoid_blocks__: true,
    version: 1,
    timestamp: Date.now(),
    blocks: clone(blockList)
  })
}

function copyBlocksToClipboard(blockList: Block[], notify = true) {
  if (!blockList || blockList.length === 0) return
  const jsonPayload = serializeBlocks(blockList)

  // 1. Store in localStorage for 100% reliable cross-lesson copy-paste
  try {
    localStorage.setItem('pixelnoid_copied_blocks', jsonPayload)
  } catch (e) {
    console.warn('LocalStorage save failed', e)
  }

  // 2. Also write to system clipboard
  if (navigator?.clipboard?.writeText) {
    navigator.clipboard.writeText(jsonPayload).catch(() => {})
  }

  if (notify) {
    showEditorToast(`${blockList.length} blok berhasil disalin!`)
  }
}

function copySelectedBlocks() {
  if (selectedBlockIndices.value.size === 0) return
  const indices = Array.from(selectedBlockIndices.value).sort((a, b) => a - b)
  const toCopy = indices.map(i => blocks.value[i]).filter(Boolean)
  copyBlocksToClipboard(toCopy)
  clearBlockSelection()
}

function copyCurrentBlock(index: number) {
  const block = blocks.value[index]
  if (block) {
    copyBlocksToClipboard([block])
    closeTuneMenu()
  }
}

function copyAllBlocks() {
  copyBlocksToClipboard(blocks.value)
}

function pasteStoredBlocks(targetIndex?: number): boolean {
  let jsonStr = ''
  try {
    jsonStr = localStorage.getItem('pixelnoid_copied_blocks') || ''
  } catch {}

  if (!jsonStr) {
    showEditorToast('Tidak ada blok di clipboard.', 'error')
    return false
  }

  try {
    const parsed = JSON.parse(jsonStr)
    const blocksToInsert: Block[] = parsed.__pixelnoid_blocks__ ? parsed.blocks : (Array.isArray(parsed) ? parsed : null)
    if (blocksToInsert && blocksToInsert.length > 0) {
      const freshBlocks = blocksToInsert.map(b => {
        const dup = clone(b)
        dup.id = genId()
        return dup
      })

      const idx = typeof targetIndex === 'number'
        ? targetIndex
        : (activeBlockIndex.value !== null && activeBlockIndex.value >= 0 ? activeBlockIndex.value : blocks.value.length - 1)

      const curBlock = blocks.value[idx]
      const curEmpty = curBlock && curBlock.type === 'paragraph' && !curBlock.content?.trim()

      if (curEmpty) {
        blocks.value.splice(idx, 1, ...freshBlocks)
      } else {
        blocks.value.splice(idx + 1, 0, ...freshBlocks)
      }

      emitChanges()
      showEditorToast(`${freshBlocks.length} blok berhasil ditempel!`)
      nextTick(() => focusBlock(Math.min(idx + freshBlocks.length - (curEmpty ? 1 : 0), blocks.value.length - 1)))
      return true
    }
  } catch (e) {
    console.error('Failed to paste stored blocks:', e)
  }
  showEditorToast('Gagal menempelkan blok.', 'error')
  return false
}

function openBatchTypeSelector() {
  if (selectedBlockIndices.value.size === 0) return
  const firstIdx = Math.min(...Array.from(selectedBlockIndices.value))
  const rowEl = document.querySelectorAll('.group\\/row')[firstIdx] as HTMLElement
  const rect = rowEl?.getBoundingClientRect() || { bottom: 200, left: 200, top: 160 }

  blockMenu.open = true
  blockMenu.targetIndex = firstIdx
  blockMenu.mode = 'batchChange'
  blockMenu.search = ''
  blockMenu.selectedIndex = 0
  calculateMenuPosition(rect)

  nextTick(() => menuSearchInput.value?.focus())
}

// ── Block Operations ───────────────────────────────────────────────
function setActiveBlock(index: number) {
  activeBlockIndex.value = index
  if (!marquee.active && selectedBlockIndices.value.size > 1 && !justFinishedMarquee) {
    clearBlockSelection()
  }
}

function focusOrCreateEndBlock() {
  const lastIndex = blocks.value.length - 1
  const lastBlock = blocks.value[lastIndex]
  if (lastBlock && lastBlock.type === 'paragraph' && !lastBlock.content?.trim()) {
    focusBlock(lastIndex)
    return
  }
  insertNewBlockAfter(lastIndex)
}

function insertNewBlockAfter(index: number, type: Block['type'] = 'paragraph') {
  const nb = createEmptyBlock(type)
  blocks.value.splice(index + 1, 0, nb)
  clearBlockSelection()
  emitChanges()
  nextTick(() => focusBlock(index + 1))
}

function deleteBlock(index: number) {
  if (blocks.value.length <= 1) {
    blocks.value = [createEmptyBlock('paragraph')]
  } else {
    blocks.value.splice(index, 1)
  }
  clearBlockSelection()
  emitChanges()
  nextTick(() => focusBlock(Math.max(0, index - 1)))
}

function duplicateBlock(index: number) {
  const original = blocks.value[index]
  if (!original) return
  const dup = clone(original)
  dup.id = genId()
  blocks.value.splice(index + 1, 0, dup)
  emitChanges()
  closeTuneMenu()
  nextTick(() => focusBlock(index + 1))
}

function moveBlock(index: number, direction: -1 | 1) {
  const targetIndex = index + direction
  if (targetIndex < 0 || targetIndex >= blocks.value.length) return
  const [moved] = blocks.value.splice(index, 1)
  blocks.value.splice(targetIndex, 0, moved)
  emitChanges()
  closeTuneMenu()
  nextTick(() => focusBlock(targetIndex))
}

function focusBlock(index: number) {
  const block = blocks.value[index]
  if (!block) return
  setActiveBlock(index)
  if (block.type === 'bulletList' || block.type === 'numberedList') {
    const listRef = listEditableRefs.value[`${index}-0`]
    listRef?.focusEnd?.()
  } else {
    const el = editableRefs.value[index]
    el?.focusEnd?.()
  }
}

// ── Typing & Keyboard Handlers ─────────────────────────────────────
function handleInput(index: number) {
  emitChanges()
  const block = blocks.value[index]
  if (!block) return

  const plainText = (block.content || '').replace(/<[^>]*>/g, '').trim()
  if (plainText === '/') {
    triggerSlashCommand(index)
  } else if (blockMenu.open && blockMenu.mode === 'slashCommand') {
    if (plainText.startsWith('/')) {
      blockMenu.search = plainText.substring(1)
    } else {
      closeBlockMenu()
    }
  }
}

function handleKeyDown(ev: KeyboardEvent, index: number) {
  const block = blocks.value[index]
  if (!block) return

  // Alt + ArrowUp / ArrowDown to smoothly reorder active block
  if (ev.altKey && (ev.key === 'ArrowUp' || ev.key === 'ArrowDown')) {
    ev.preventDefault()
    if (ev.key === 'ArrowUp' && index > 0) {
      moveBlock(index, -1)
    } else if (ev.key === 'ArrowDown' && index < blocks.value.length - 1) {
      moveBlock(index, 1)
    }
    return
  }

  if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 'a') {
    const sel = window.getSelection()
    const textLen = (block.content || '').replace(/<[^>]*>/g, '').length
    if (sel && (sel.toString().length >= textLen - 1 || selectedBlockIndices.value.size > 0)) {
      ev.preventDefault()
      selectedBlockIndices.value.clear()
      blocks.value.forEach((_, i) => selectedBlockIndices.value.add(i))
      sel.removeAllRanges()
      return
    }
  }

  if (ev.shiftKey && (ev.key === 'ArrowDown' || ev.key === 'ArrowUp')) {
    const sel = window.getSelection()
    const textLen = (block.content || '').replace(/<[^>]*>/g, '').length
    if (ev.key === 'ArrowDown' && sel && sel.anchorOffset >= textLen && index < blocks.value.length - 1) {
      ev.preventDefault()
      selectedBlockIndices.value.add(index)
      selectedBlockIndices.value.add(index + 1)
      activeBlockIndex.value = index + 1
      return
    }
    if (ev.key === 'ArrowUp' && sel && sel.anchorOffset === 0 && index > 0) {
      ev.preventDefault()
      selectedBlockIndices.value.add(index)
      selectedBlockIndices.value.add(index - 1)
      activeBlockIndex.value = index - 1
      return
    }
  }

  if (ev.key === 'Enter' && !ev.shiftKey) {
    ev.preventDefault()
    if (blockMenu.open) { selectCurrentMenuItem(); return }
    insertNewBlockAfter(index)
    return
  }

  if (ev.key === 'Backspace') {
    const plainText = (block.content || '').replace(/<[^>]*>/g, '').trim()
    if (plainText === '' || plainText === '\n') {
      ev.preventDefault()
      if (block.type !== 'paragraph') {
        block.type = 'paragraph'
        emitChanges()
        return
      }
      deleteBlock(index)
      return
    }
  }

  if (ev.key === 'ArrowUp' && index > 0) {
    const sel = window.getSelection()
    if (sel && sel.anchorOffset === 0) {
      ev.preventDefault()
      focusBlock(index - 1)
    }
  }

  if (ev.key === 'ArrowDown' && index < blocks.value.length - 1) {
    const sel = window.getSelection()
    const plainText = (block.content || '').replace(/<[^>]*>/g, '')
    if (sel && sel.anchorOffset >= plainText.length) {
      ev.preventDefault()
      focusBlock(index + 1)
    }
  }
}

function handleGlobalKeyDown(ev: KeyboardEvent) {
  if (selectedBlockIndices.value.size > 0) {
    if (ev.key === 'Backspace' || ev.key === 'Delete') { ev.preventDefault(); deleteSelectedBlocks(); return }
    if (ev.key === 'Escape') { ev.preventDefault(); clearBlockSelection(); return }
    if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 'c') { copySelectedBlocks(); return }
  }
}

// ── List Item Handlers ─────────────────────────────────────────────
function updateListItem(blockIndex: number, itemIndex: number, newVal: string) {
  const block = blocks.value[blockIndex]
  if (!block || !block.items) return
  block.items[itemIndex] = newVal
  emitChanges()
}

function handleListKeyDown(ev: KeyboardEvent, blockIndex: number, itemIndex: number) {
  const block = blocks.value[blockIndex]
  if (!block || !block.items) return

  if (ev.key === 'Enter' && !ev.shiftKey) {
    ev.preventDefault()
    const currentText = block.items[itemIndex]?.replace(/<[^>]*>/g, '').trim()
    if (!currentText) {
      if (block.items.length > 1) {
        block.items.splice(itemIndex, 1)
      } else {
        block.type = 'paragraph'
        block.content = ''
        block.items = undefined
      }
      insertNewBlockAfter(blockIndex, 'paragraph')
      emitChanges()
      return
    }
    block.items.splice(itemIndex + 1, 0, '')
    emitChanges()
    nextTick(() => { listEditableRefs.value[`${blockIndex}-${itemIndex + 1}`]?.focusStart?.() })
    return
  }

  if (ev.key === 'Backspace') {
    const currentText = block.items[itemIndex]?.replace(/<[^>]*>/g, '').trim()
    if (!currentText) {
      ev.preventDefault()
      if (block.items.length > 1) {
        block.items.splice(itemIndex, 1)
        emitChanges()
        nextTick(() => listEditableRefs.value[`${blockIndex}-${Math.max(0, itemIndex - 1)}`]?.focusEnd?.())
      } else {
        block.type = 'paragraph'
        block.content = ''
        block.items = undefined
        emitChanges()
      }
    }
  }
}

// ── Code Block Helpers ─────────────────────────────────────────────
function updateCodeContent(index: number, content: string) {
  const b = blocks.value[index]
  if (b) { b.content = content; emitChanges() }
}

function updateCodeLang(index: number, lang: string) {
  const b = blocks.value[index]
  if (b) { b.language = lang; emitChanges() }
}

function insertTab(ev: KeyboardEvent, index: number) {
  const textarea = ev.target as HTMLTextAreaElement
  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const val = textarea.value
  textarea.value = val.substring(0, start) + '  ' + val.substring(end)
  textarea.selectionStart = textarea.selectionEnd = start + 2
  updateCodeContent(index, textarea.value)
}

function copyCode(code: string, index: number) {
  navigator.clipboard.writeText(code).then(() => {
    copiedBlockIndex.value = index
    setTimeout(() => { if (copiedBlockIndex.value === index) copiedBlockIndex.value = null }, 2000)
  })
}

// ── Image Block Helpers ────────────────────────────────────
function onImageFileChosen(ev: Event, index: number) {
  const file = (ev.target as HTMLInputElement).files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (e) => {
    const block = blocks.value[index]
    if (block) { block.url = e.target?.result as string; emitChanges() }
  }
  reader.readAsDataURL(file)
}

function applyImageUrl(index: number) {
  const url = imageUrlInputs[index]?.trim()
  if (!url) return
  const block = blocks.value[index]
  if (block) { block.url = url; imageUrlInputs[index] = ''; emitChanges() }
}

function updateImageCaption(index: number, caption: string) {
  updateCaption(index, caption)
}

function updateCaption(index: number, caption: string) {
  const block = blocks.value[index]
  if (block) { block.caption = caption; emitChanges() }
}

// ── Bookmark & Canva Helpers ─────────────────────────────────────────
function getUrlHostname(url?: string): string {
  if (!url) return ''
  try {
    const parsed = new URL(url.startsWith('http') ? url : 'https://' + url)
    return parsed.hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

function getFaviconUrl(url?: string): string {
  const hostname = getUrlHostname(url)
  if (!hostname) return ''
  return `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`
}

function parseCanvaEmbedUrl(input: string): string {
  let clean = input.trim()
  if (!clean) return ''

  // If user pasted iframe HTML: <iframe ... src="url" ...>
  const iframeMatch = clean.match(/src=["']([^"']+)["']/i)
  if (iframeMatch && iframeMatch[1]) {
    clean = iframeMatch[1]
  }

  // If user pasted Canva design link
  if (clean.includes('canva.com/design/')) {
    clean = clean.replace(/\/watch(\?.*)?$/i, '/view$1').replace(/\/edit(\?.*)?$/i, '/view$1')
    if (!clean.includes('embed')) {
      clean += (clean.includes('?') ? '&' : '?') + 'embed'
    }
  }

  if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
    clean = 'https://' + clean
  }

  return clean
}

async function applyBookmarkUrl(index: number) {
  let url = bookmarkUrlInputs[index]?.trim()
  if (!url) return
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url
  }
  const block = blocks.value[index]
  if (!block) return

  block.url = url
  bookmarkUrlInputs[index] = ''

  if (!block.bookmarkData) {
    block.bookmarkData = {
      url,
      title: getUrlHostname(url),
      description: ''
    }
  } else {
    block.bookmarkData.url = url
    if (!block.bookmarkData.title) block.bookmarkData.title = getUrlHostname(url)
  }
  emitChanges()

  // Auto fetch metadata asynchronously from server
  isFetchingMetadata[index] = true
  try {
    const data = await $fetch<{ url: string; title: string; description: string; favicon: string }>('/api/admin/bookmark/metadata', {
      params: { url }
    })
    if (data && block.bookmarkData) {
      if (data.title) block.bookmarkData.title = data.title
      if (data.description) block.bookmarkData.description = data.description
      if (data.favicon) block.bookmarkData.favicon = data.favicon
      emitChanges()
    }
  } catch (e) {
    console.warn('Metadata fetch failed, falling back to hostname:', e)
  } finally {
    isFetchingMetadata[index] = false
  }
}

function updateBookmarkTitle(index: number, title: string) {
  const block = blocks.value[index]
  if (block) {
    if (!block.bookmarkData) block.bookmarkData = { url: block.url || '', title }
    else block.bookmarkData.title = title
    emitChanges()
  }
}

function updateBookmarkDesc(index: number, desc: string) {
  const block = blocks.value[index]
  if (block) {
    if (!block.bookmarkData) block.bookmarkData = { url: block.url || '', description: desc }
    else block.bookmarkData.description = desc
    emitChanges()
  }
}

function applyCanvaUrl(index: number) {
  const raw = canvaUrlInputs[index]?.trim()
  if (!raw) return
  const url = parseCanvaEmbedUrl(raw)
  const block = blocks.value[index]
  if (block) {
    block.url = url
    canvaUrlInputs[index] = ''
    emitChanges()
  }
}

// ── Table Block Helpers ────────────────────────────────────────────
const tableCellRefs = ref<Record<string, any>>({})
const resizingCol = ref<{ blockIndex: number; colIndex: number } | null>(null)

function setTableCellRef(el: any, blockIdx: number, rIdx: number, cIdx: number) {
  if (el) tableCellRefs.value[`${blockIdx}-${rIdx}-${cIdx}`] = el
  else delete tableCellRefs.value[`${blockIdx}-${rIdx}-${cIdx}`]
}

function getColWidth(block: Block, cIdx: number): number {
  return block.tableData?.colWidths?.[cIdx] ?? 160
}

function getTableTotalWidth(block: Block): number {
  const cols = block.tableData?.rows[0]?.length ?? 0
  let total = 44 
  for (let i = 0; i < cols; i++) total += getColWidth(block, i)
  return total
}

function updateTableCell(blockIdx: number, rIdx: number, cIdx: number, val: string) {
  const block = blocks.value[blockIdx]
  if (!block?.tableData) return
  block.tableData.rows[rIdx][cIdx] = val
  emitChanges()
}

function handleTableCellKeydown(ev: KeyboardEvent, blockIdx: number, rIdx: number, cIdx: number) {
  const block = blocks.value[blockIdx]
  if (!block?.tableData) return
  const rows = block.tableData.rows
  const colCount = rows[0]?.length ?? 0

  // 1. Tab / Shift+Tab: standard accessible cell navigation
  if (ev.key === 'Tab') {
    ev.preventDefault()
    if (ev.shiftKey) {
      if (cIdx > 0) {
        tableCellRefs.value[`${blockIdx}-${rIdx}-${cIdx - 1}`]?.focusStart?.()
      } else if (rIdx > 0) {
        tableCellRefs.value[`${blockIdx}-${rIdx - 1}-${colCount - 1}`]?.focusStart?.()
      }
    } else {
      const nextCIdx = cIdx + 1
      if (nextCIdx < colCount) {
        tableCellRefs.value[`${blockIdx}-${rIdx}-${nextCIdx}`]?.focusStart?.()
      } else if (rIdx + 1 < rows.length) {
        tableCellRefs.value[`${blockIdx}-${rIdx + 1}-0`]?.focusStart?.()
      } else {
        addTableRow(blockIdx)
        nextTick(() => tableCellRefs.value[`${blockIdx}-${rows.length}-0`]?.focusStart?.())
      }
    }
    return
  }

  // 2. Alt + ArrowLeft / ArrowRight for explicit cell navigation (leaves normal typing intact)
  if (ev.altKey) {
    if (ev.key === 'ArrowRight' && cIdx < colCount - 1) {
      ev.preventDefault()
      tableCellRefs.value[`${blockIdx}-${rIdx}-${cIdx + 1}`]?.focusStart?.()
      return
    }
    if (ev.key === 'ArrowLeft' && cIdx > 0) {
      ev.preventDefault()
      tableCellRefs.value[`${blockIdx}-${rIdx}-${cIdx - 1}`]?.focusEnd?.()
      return
    }
  }

  // 3. ArrowUp / ArrowDown row jumps
  if (ev.key === 'ArrowDown' && rIdx < rows.length - 1) {
    ev.preventDefault()
    tableCellRefs.value[`${blockIdx}-${rIdx + 1}-${cIdx}`]?.focusStart?.()
    return
  }

  if (ev.key === 'ArrowUp' && rIdx > 0) {
    ev.preventDefault()
    tableCellRefs.value[`${blockIdx}-${rIdx - 1}-${cIdx}`]?.focusStart?.()
    return
  }
}

function addTableRow(blockIdx: number) {
  const block = blocks.value[blockIdx]
  if (!block?.tableData) return
  const colCount = block.tableData.rows[0]?.length ?? 3
  block.tableData.rows.push(Array(colCount).fill(''))
  emitChanges()
}

function addTableColumn(blockIdx: number) {
  const block = blocks.value[blockIdx]
  if (!block?.tableData) return
  block.tableData.rows.forEach(row => row.push(''))
  if (!block.tableData.colWidths) block.tableData.colWidths = []
  block.tableData.colWidths.push(160)
  emitChanges()
}

function deleteTableRow(blockIdx: number, rIdx: number) {
  const block = blocks.value[blockIdx]
  if (!block?.tableData || block.tableData.rows.length <= 1) return
  block.tableData.rows.splice(rIdx, 1)
  emitChanges()
}

function deleteTableColumn(blockIdx: number, cIdx: number) {
  const block = blocks.value[blockIdx]
  if (!block?.tableData) return
  const colCount = block.tableData.rows[0]?.length ?? 0
  if (colCount <= 1) return
  block.tableData.rows.forEach(row => row.splice(cIdx, 1))
  block.tableData.colWidths?.splice(cIdx, 1)
  emitChanges()
}

function toggleTableHeadings(blockIdx: number) {
  const block = blocks.value[blockIdx]
  if (!block?.tableData) return
  block.tableData.withHeadings = !block.tableData.withHeadings
  emitChanges()
}

function distributeTableColumns(blockIdx: number) {
  const block = blocks.value[blockIdx]
  if (!block?.tableData) return
  const cols = block.tableData.rows[0]?.length ?? 0
  if (cols === 0) return
  const containerWidth = 620 
  const equalWidth = Math.floor(containerWidth / cols)
  block.tableData.colWidths = Array(cols).fill(equalWidth)
  emitChanges()
}

let colResizeStartX = 0
let colResizeStartWidth = 0

function startColResize(blockIdx: number, cIdx: number, ev: MouseEvent) {
  resizingCol.value = { blockIndex: blockIdx, colIndex: cIdx }
  colResizeStartX = ev.clientX
  const block = blocks.value[blockIdx]
  colResizeStartWidth = block?.tableData?.colWidths?.[cIdx] ?? 160

  const onMove = (e: MouseEvent) => {
    const b = blocks.value[blockIdx]
    if (!b?.tableData || !resizingCol.value) return
    const delta = e.clientX - colResizeStartX
    const newWidth = Math.max(60, colResizeStartWidth + delta)
    if (!b.tableData.colWidths) {
      b.tableData.colWidths = Array(b.tableData.rows[0]?.length ?? 0).fill(160)
    }
    b.tableData.colWidths[cIdx] = newWidth
  }

  const onUp = () => {
    resizingCol.value = null
    emitChanges()
    window.removeEventListener('mousemove', onMove)
    window.removeEventListener('mouseup', onUp)
  }

  window.addEventListener('mousemove', onMove)
  window.addEventListener('mouseup', onUp)
}

function startColResizeTouch(blockIdx: number, cIdx: number, ev: TouchEvent) {
  const touch = ev.touches[0]
  if (!touch) return
  resizingCol.value = { blockIndex: blockIdx, colIndex: cIdx }
  colResizeStartX = touch.clientX
  const block = blocks.value[blockIdx]
  colResizeStartWidth = block?.tableData?.colWidths?.[cIdx] ?? 160

  const onTouchMove = (e: TouchEvent) => {
    const t = e.touches[0]
    if (!t || !resizingCol.value) return
    const delta = t.clientX - colResizeStartX
    const newWidth = Math.max(60, colResizeStartWidth + delta)
    const b = blocks.value[blockIdx]
    if (!b?.tableData) return
    if (!b.tableData.colWidths) {
      b.tableData.colWidths = Array(b.tableData.rows[0]?.length ?? 0).fill(160)
    }
    b.tableData.colWidths[cIdx] = newWidth
  }

  const onTouchEnd = () => {
    resizingCol.value = null
    emitChanges()
    window.removeEventListener('touchmove', onTouchMove)
    window.removeEventListener('touchend', onTouchEnd)
  }

  window.addEventListener('touchmove', onTouchMove, { passive: true })
  window.addEventListener('touchend', onTouchEnd)
}

function migrateTablesFromContent(blockList: Block[]): boolean {
  let changed = false
  for (const block of blockList) {
    if (block.content && block.content.includes('<table')) {
      const parser = new DOMParser()
      const doc = parser.parseFromString(block.content, 'text/html')
      const tableEl = doc.querySelector('table')
      if (!tableEl) continue
      const rows: string[][] = []
      tableEl.querySelectorAll('tr').forEach(tr => {
        const cells: string[] = []
        tr.querySelectorAll('td, th').forEach(td => cells.push((td as HTMLElement).innerText.trim()))
        if (cells.length > 0) rows.push(cells)
      })
      if (rows.length > 0) {
        const hasHeader = !!tableEl.querySelector('th')
        block.type = 'table'
        block.content = ''
        block.tableData = {
          withHeadings: hasHeader,
          colWidths: Array(rows[0].length).fill(160),
          rows
        }
        changed = true
      }
    }
  }
  return changed
}

function handlePaste(ev: ClipboardEvent, blockIndex: number) {
  const plainText = ev.clipboardData?.getData('text/plain') || ''

  // 1. Cross-lesson structured block paste (Pixelnoid Blocks format)
  if (plainText.includes('"__pixelnoid_blocks__":true')) {
    try {
      const parsed = JSON.parse(plainText)
      const list: Block[] = parsed.blocks
      if (Array.isArray(list) && list.length > 0) {
        ev.preventDefault()
        const freshBlocks = list.map(b => {
          const dup = clone(b)
          dup.id = genId()
          return dup
        })
        const curBlock = blocks.value[blockIndex]
        const curEmpty = curBlock && curBlock.type === 'paragraph' && !curBlock.content?.trim()
        if (curEmpty) {
          blocks.value.splice(blockIndex, 1, ...freshBlocks)
        } else {
          blocks.value.splice(blockIndex + 1, 0, ...freshBlocks)
        }
        emitChanges()
        showEditorToast(`${freshBlocks.length} blok berhasil ditempel!`)
        nextTick(() => focusBlock(Math.min(blockIndex + freshBlocks.length - (curEmpty ? 1 : 0), blocks.value.length - 1)))
        return
      }
    } catch (e) {
      console.warn('Failed parsing structured blocks from paste:', e)
    }
  }

  const html = ev.clipboardData?.getData('text/html') || ''

  // 2. Canva embed auto-detection
  if (
    (plainText.includes('canva.com/design/') || (plainText.includes('<iframe') && plainText.includes('canva.com'))) &&
    !plainText.includes('\n\n')
  ) {
    const curBlock = blocks.value[blockIndex]
    const curText = (curBlock?.content || '').replace(/<[^>]*>/g, '').trim()
    if (!curText) {
      ev.preventDefault()
      curBlock.type = 'canva'
      curBlock.url = parseCanvaEmbedUrl(plainText)
      emitChanges()
      return
    }
  }

// 3 & 4. Merged Formatted HTML (Headings, lists, quotes, codes, and tables)
  if (html && (html.includes('<h1') || html.includes('<h2') || html.includes('<h3') || html.includes('<p') || html.includes('<ul') || html.includes('<ol') || html.includes('<pre') || html.includes('<blockquote') || html.includes('<table'))) {
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')
    const extractedBlocks: Block[] = []
    const elements = doc.body.children
    
    for (let i = 0; i < elements.length; i++) {
      const el = elements[i] as HTMLElement
      const tag = el.tagName.toLowerCase()
      
      if (tag === 'h1') extractedBlocks.push({ id: genId(), type: 'heading1', content: el.innerHTML })
      else if (tag === 'h2') extractedBlocks.push({ id: genId(), type: 'heading2', content: el.innerHTML })
      else if (tag === 'h3' || tag === 'h4' || tag === 'h5' || tag === 'h6') extractedBlocks.push({ id: genId(), type: 'heading3', content: el.innerHTML })
      else if (tag === 'ul') {
        const lis = Array.from(el.querySelectorAll('li')).map(li => li.innerHTML)
        extractedBlocks.push({ id: genId(), type: 'bulletList', items: lis.length ? lis : [''] })
      } else if (tag === 'ol') {
        const lis = Array.from(el.querySelectorAll('li')).map(li => li.innerHTML)
        extractedBlocks.push({ id: genId(), type: 'numberedList', items: lis.length ? lis : [''] })
      } else if (tag === 'blockquote') extractedBlocks.push({ id: genId(), type: 'quote', content: el.innerHTML })
      else if (tag === 'pre') extractedBlocks.push({ id: genId(), type: 'code', content: el.innerText, language: 'javascript' })
      else if (tag === 'hr') extractedBlocks.push({ id: genId(), type: 'divider' })
      else if (tag === 'table') {
        const rows: string[][] = []
        el.querySelectorAll('tr').forEach(tr => {
          const cells: string[] = []
          tr.querySelectorAll('td, th').forEach(td => cells.push((td as HTMLElement).innerText.trim()))
          if (cells.length > 0) rows.push(cells)
        })
        if (rows.length > 0) {
          const hasHeader = !!el.querySelector('th')
          extractedBlocks.push({
            id: genId(),
            type: 'table',
            tableData: {
              withHeadings: hasHeader,
              colWidths: Array(rows[0].length).fill(160),
              rows
            }
          })
        }
      }
      else {
        const txt = el.innerHTML.trim()
        if (txt) extractedBlocks.push({ id: genId(), type: 'paragraph', content: txt })
      }
    }
    
    if (extractedBlocks.length > 0) {
      ev.preventDefault()
      const curBlock = blocks.value[blockIndex]
      const curText = (curBlock?.content || '').replace(/<[^>]*>/g, '').trim()
      
      if (!curText) blocks.value.splice(blockIndex, 1, ...extractedBlocks)
      else blocks.value.splice(blockIndex + 1, 0, ...extractedBlocks)
      
      emitChanges()
      return
    }
  }

  // 5. Plain text multiple paragraphs
  if (plainText.includes('\n\n')) {
    ev.preventDefault()
    const paragraphs = plainText.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean)
    const newBlocks: Block[] = paragraphs.map(p => ({
      id: genId(),
      type: 'paragraph',
      content: p.replace(/\n/g, '<br>')
    }))
    if (newBlocks.length > 0) {
      const curBlock = blocks.value[blockIndex]
      const curText = (curBlock?.content || '').replace(/<[^>]*>/g, '').trim()
      if (!curText) blocks.value.splice(blockIndex, 1, ...newBlocks)
      else blocks.value.splice(blockIndex + 1, 0, ...newBlocks)
      emitChanges()
      return
    }
  }
}

// Clamping popovers so they never get cut off by viewport bounds
function calculateMenuPosition(rect: DOMRect) {
  const menuWidth = 264
  const menuHeight = 310
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight

  let top = rect.bottom + 6
  if (top + menuHeight > viewportHeight - 16) {
    top = Math.max(16, rect.top - menuHeight - 6)
  }

  let left = rect.left
  if (left + menuWidth > viewportWidth - 16) {
    left = Math.max(16, viewportWidth - menuWidth - 16)
  }
  if (left < 16) left = 16

  blockMenu.top = top
  blockMenu.left = left
}

function triggerSlashCommand(index: number) {
  const rowEl = document.querySelectorAll('.group\\/row')[index] as HTMLElement
  if (!rowEl) return
  const rect = rowEl.getBoundingClientRect()
  blockMenu.open = true
  blockMenu.targetIndex = index
  blockMenu.mode = 'slashCommand'
  blockMenu.search = ''
  blockMenu.selectedIndex = 0
  calculateMenuPosition(rect)
  nextTick(() => menuSearchInput.value?.focus())
}

// Open menu to ADD a new block below (triggered by + button)
function openAddBlockMenu(index: number) {
  const rowEl = document.querySelectorAll('.group\\/row')[index] as HTMLElement
  if (!rowEl) return
  const rect = rowEl.getBoundingClientRect()
  blockMenu.open = true
  blockMenu.targetIndex = index
  blockMenu.mode = 'insertBelow'
  blockMenu.search = ''
  blockMenu.selectedIndex = 0
  calculateMenuPosition(rect)
  nextTick(() => menuSearchInput.value?.focus())
}

// Open menu to TURN INTO another type (triggered by tune menu)
function openTurnIntoMenu(index: number) {
  const rowEl = document.querySelectorAll('.group\\/row')[index] as HTMLElement
  if (!rowEl) return
  const rect = rowEl.getBoundingClientRect()
  closeTuneMenu()
  blockMenu.open = true
  blockMenu.targetIndex = index
  blockMenu.mode = 'turnInto'
  blockMenu.search = ''
  blockMenu.selectedIndex = 0
  calculateMenuPosition(rect)
  nextTick(() => menuSearchInput.value?.focus())
}

function closeBlockMenu() {
  blockMenu.open = false
}

function navigateMenu(direction: 1 | -1) {
  const total = filteredMenuItems.value.length
  if (total === 0) return
  blockMenu.selectedIndex = (blockMenu.selectedIndex + direction + total) % total
}

function selectCurrentMenuItem() {
  const item = filteredMenuItems.value[blockMenu.selectedIndex]
  if (item) applyBlockType(item.type as Block['type'])
}

// Graceful conversion between block types without losing content
function convertBlockType(block: Block, newType: Block['type']) {
  const oldType = block.type
  if (oldType === newType) return

  let existingText = ''
  if (block.content) {
    existingText = block.content
  } else if (block.items && block.items.length > 0) {
    existingText = block.items.filter(Boolean).join('<br>')
  } else if (block.url) {
    existingText = block.url
  }

  block.type = newType

  if (newType === 'heading1' || newType === 'heading2' || newType === 'heading3' || newType === 'paragraph' || newType === 'quote' || newType === 'callout') {
    block.content = existingText
    block.items = undefined
  } else if (newType === 'bulletList' || newType === 'numberedList') {
    if (existingText.includes('<br>')) {
      block.items = existingText.split('<br>').map(s => s.trim()).filter(Boolean)
    } else {
      block.items = [existingText || '']
    }
    block.content = undefined
  } else if (newType === 'code') {
    block.content = existingText.replace(/<[^>]*>/g, '')
    block.language = block.language || 'javascript'
  } else if (newType === 'bookmark') {
    block.url = block.url || (existingText.startsWith('http') ? existingText : '')
    if (!block.bookmarkData) {
      block.bookmarkData = { url: block.url, title: getUrlHostname(block.url), description: '' }
    }
  } else if (newType === 'canva') {
    block.url = block.url || (existingText.includes('canva.com') ? existingText : '')
  } else if (newType === 'table') {
    if (!block.tableData) {
      block.tableData = {
        withHeadings: true,
        colWidths: [140, 200, 280],
        rows: [['Header 1', 'Header 2', 'Header 3'], [existingText.replace(/<[^>]*>/g, ''), '', ''], ['', '', '']]
      }
    }
  }
}

function applyBlockType(type: Block['type']) {
  // Batch conversion of selected blocks
  if (blockMenu.mode === 'batchChange' && selectedBlockIndices.value.size > 0) {
    selectedBlockIndices.value.forEach(idx => {
      const b = blocks.value[idx]
      if (b) convertBlockType(b, type)
    })
    closeBlockMenu()
    emitChanges()
    return
  }

  const index = blockMenu.targetIndex
  const block = blocks.value[index]
  if (!block) return

  // Mode: INSERT BELOW (+) -> Creates a new block below, NEVER overwrites!
  if (blockMenu.mode === 'insertBelow') {
    insertNewBlockAfter(index, type)
    closeBlockMenu()
    return
  }

  // Mode: TURN INTO -> Converts existing block preserving data
  if (blockMenu.mode === 'turnInto') {
    convertBlockType(block, type)
    closeBlockMenu()
    emitChanges()
    nextTick(() => focusBlock(index))
    return
  }

  // Mode: SLASH COMMAND -> Replace current slash block
  if (blockMenu.mode === 'slashCommand') {
    block.content = ''
    convertBlockType(block, type)
    closeBlockMenu()
    emitChanges()
    nextTick(() => focusBlock(index))
    return
  }
}

function toggleTuneMenu(index: number, ev: MouseEvent | KeyboardEvent) {
  if (tuneMenu.open && tuneMenu.blockIndex === index) { closeTuneMenu(); return }
  const btn = ev.currentTarget as HTMLElement
  const rect = btn.getBoundingClientRect()
  tuneMenu.open = true
  tuneMenu.blockIndex = index

  const menuWidth = 208
  const menuHeight = 240
  let top = rect.bottom + 4
  if (top + menuHeight > window.innerHeight - 16) {
    top = Math.max(16, rect.top - menuHeight - 4)
  }
  let left = Math.max(16, Math.min(window.innerWidth - menuWidth - 16, rect.left - 20))

  tuneMenu.top = top
  tuneMenu.left = left
}

function closeTuneMenu() { tuneMenu.open = false }

function handleSelectionChange() {
  const sel = window.getSelection()
  if (!sel || sel.isCollapsed || sel.rangeCount === 0 || marquee.active) {
    inlineToolbar.show = false
    return
  }
  const range = sel.getRangeAt(0)
  const container = range.commonAncestorContainer
  const editorEl = document.querySelector('.min-h-\\[240px\\]')
  if (!editorEl?.contains(container)) {
    inlineToolbar.show = false
    return
  }
  const rect = range.getBoundingClientRect()
  inlineToolbar.show = true

  const toolbarWidth = 240
  let top = rect.top - 46
  // Flip below if too close to sticky top header
  if (top < 75) {
    top = rect.bottom + 8
  }

  let left = rect.left + (rect.width / 2) - (toolbarWidth / 2)
  left = Math.max(16, Math.min(window.innerWidth - toolbarWidth - 16, left))

  inlineToolbar.top = top
  inlineToolbar.left = left
}

function execFormat(command: string) { document.execCommand(command, false); emitChanges() }

function formatInlineCode() {
  const sel = window.getSelection()
  if (!sel || sel.isCollapsed) return
  const text = sel.toString()
  document.execCommand('insertHTML', false, `<code class="px-inline-code">${text}</code>`)
  emitChanges()
}

function formatLink() {
  const url = prompt('Masukkan URL tautan:')
  if (!url) return
  document.execCommand('createLink', false, url)
  const sel = window.getSelection()
  if (sel?.anchorNode?.parentElement?.tagName === 'A') {
    sel.anchorNode.parentElement.setAttribute('target', '_blank')
  }
  emitChanges()
}

// ── Smooth Drag & Drop Handlers ─────────────────────────────────────
function onDragStart(ev: DragEvent, index: number) {
  draggingIndex.value = index
  if (ev.dataTransfer) {
    ev.dataTransfer.effectAllowed = 'move'
    ev.dataTransfer.setData('text/plain', String(index))
  }
}

function onDragEnd() {
  draggingIndex.value = null
  dropTargetIndex.value = null
}

function onDragOver(ev: DragEvent, index: number) {
  if (draggingIndex.value === null || draggingIndex.value === index) return
  const rowEl = ev.currentTarget as HTMLElement
  const rect = rowEl.getBoundingClientRect()
  const relY = ev.clientY - rect.top
  dropPosition.value = relY < rect.height / 2 ? 'before' : 'after'
  dropTargetIndex.value = index
}

function onDrop(targetIndex: number) {
  const fromIndex = draggingIndex.value
  if (fromIndex === null || fromIndex === targetIndex) {
    draggingIndex.value = null
    dropTargetIndex.value = null
    return
  }

  let destIndex = dropPosition.value === 'before' ? targetIndex : targetIndex + 1
  if (fromIndex < destIndex) destIndex--

  if (fromIndex !== destIndex) {
    const [moved] = blocks.value.splice(fromIndex, 1)
    blocks.value.splice(destIndex, 0, moved)
    emitChanges()
    nextTick(() => focusBlock(destIndex))
  }

  draggingIndex.value = null
  dropTargetIndex.value = null
}

function handleGlobalClick(ev: MouseEvent) {
  if (justFinishedMarquee) return
  const target = ev.target as HTMLElement
  if (blockMenu.open && !menuRef.value?.contains(target)) closeBlockMenu()
  if (tuneMenu.open && !tuneMenuRef.value?.contains(target)) closeTuneMenu()
  if (
    selectedBlockIndices.value.size > 0 &&
    !ev.shiftKey &&
    !target.closest('.group\\/row.is-selected') &&
    !target.closest('button') &&
    !target.closest('.fixed') &&
    !marquee.active
  ) {
    clearBlockSelection()
  }
}

function handleCanvasClick(ev: MouseEvent) {
  if (justFinishedMarquee) return
  if (ev.target === ev.currentTarget && !marquee.active && selectedBlockIndices.value.size === 0) {
    focusOrCreateEndBlock()
  }
}

// Expose helper functions for parent components (e.g. edit.vue header actions)
defineExpose({
  copyAllBlocks,
  pasteStoredBlocks,
  blocks,
})
</script>