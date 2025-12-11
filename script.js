// --- Game State & Infrastructure ---
const App = {
    currentView: 'menu',
    gameInstance: null
};

// --- DOM Elements ---
const views = {
    menu: document.getElementById('view-menu'),
    game: document.getElementById('view-game')
};

const ui = {
    gameTitle: document.getElementById('game-title'),
    instruction: document.getElementById('instruction-text'),
    board: document.getElementById('game-board'),
    controls: document.getElementById('controls-area'),
    btnBack: document.getElementById('btn-back')
};

// --- View Switching ---
function switchView(viewName) {
    App.currentView = viewName;
    Object.values(views).forEach(el => el.classList.remove('active'));
    views[viewName].classList.add('active');
}

function startGame(type) {
    switchView('game');
    if (App.gameInstance) App.gameInstance.cleanup();

    if (type === 'bubble') App.gameInstance = new BubbleSortGame();
    else if (type === 'insertion') App.gameInstance = new InsertionSortGame();
    else if (type === 'selection') App.gameInstance = new SelectionSortGame();

    // Slight delay to allow view transition if needed, but synchronous is fine
    App.gameInstance.init();
}

function backToMenu() {
    if (confirm("確定要返回主選單嗎？目前的進度將會遺失。")) {
        switchView('menu');
        if (App.gameInstance) App.gameInstance.cleanup();
    }
}

// Exposed globally to ensure onclick works
window.resetGame = function () {
    console.log("Reset Game called");
    if (App.gameInstance) {
        App.gameInstance.init();
    } else {
        console.warn("No game instance to reset");
    }
};

// --- Base Game Class ---
class SortGame {
    constructor(title) {
        this.title = title;
        this.array = [];
        this.isComplete = false;
        this.stepDelay = 600;
        this.sortOrder = 'asc'; // 'asc' | 'desc'
        this.convergence = 'right'; // 'left' | 'right'
    }

    init() {
        console.log("Initializing Game: " + this.title);
        // Clear controls
        ui.controls.innerHTML = '';

        // Read size from input
        const sizeInput = document.getElementById('input-size');
        let size = 5;
        if (sizeInput) {
            size = parseInt(sizeInput.value);
            // Validation constraint
            if (isNaN(size) || size < 5) size = 5;
            if (size > 20) size = 20;
            // Update UI
            sizeInput.value = size;
        }

        // Read Sort Settings
        const orderSelect = document.getElementById('select-order');
        const convSelect = document.getElementById('select-convergence');
        this.sortOrder = orderSelect ? orderSelect.value : 'asc';
        this.convergence = convSelect ? convSelect.value : 'right';

        console.log(`Generating array size:${size}, order:${this.sortOrder}, conv:${this.convergence}`);
        this.array = this.generateRandomArray(size);
        this.isComplete = false;
        this.render();
        this.startLogic();
    }

    generateRandomArray(size) {
        // Generate numbers between 1 and 99
        return Array.from({ length: size }, () => Math.floor(Math.random() * 99) + 1);
    }

    // Helper: Returns true if 'a' should come before 'b' based on sortOrder
    shouldPrecede(a, b) {
        if (this.sortOrder === 'asc') return a < b;
        return a > b;
    }

    render() {
        ui.board.innerHTML = '';
        this.array.forEach((num, index) => {
            const card = this.createCardElement(num, index);
            ui.board.appendChild(card);
        });
    }

    createCardElement(num, index) {
        const div = document.createElement('div');
        div.className = 'card';
        div.id = `card-${index}`;
        div.innerText = num;
        return div;
    }

    setMessage(msg, type = 'normal') {
        if (!ui.instruction) return;
        ui.instruction.innerText = msg;
        ui.instruction.style.color = type === 'error' ? '#e74c3c' : (type === 'success' ? '#2ecc71' : '#16a085');
        if (type === 'error') {
            ui.instruction.classList.add('shake');
            setTimeout(() => ui.instruction.classList.remove('shake'), 500);
        }
    }

    playSuccess() {
        this.setMessage("🎉 恭喜！排序完成！", 'success');
        document.querySelectorAll('.card').forEach(c => {
            c.classList.remove('comparing', 'selected');
            c.classList.add('sorted');
        });
        ui.controls.innerHTML = '';
    }

    cleanup() { }
    startLogic() { }
}

// --- Bubble Sort Implementation ---
class BubbleSortGame extends SortGame {
    constructor() {
        super("氣泡排序 (Bubble Sort)");
        this.i = 0;
        this.j = 0;
    }

    init() {
        this.i = 0;
        // Initialize j based on convergence
        // Right Conv: j starts at 0
        // Left Conv: j starts at last index (length-1)
        this.j = 0; // will be reset in init logic if needed, but easier to handle in nextStep/updateState or locally
        super.init();

        // Correct initial j based on convergence
        if (this.convergence === 'left') {
            this.j = this.array.length - 1;
        } else {
            this.j = 0;
        }
        this.updateState(); // Trigger first state
    }

    startLogic() {
        this.createControls();
        // The first updateState is called at end of init(), because super.init() calls startLogic() at the end.
        // Wait, super.init() calls startLogic() at the end. 
        // So init() -> super.init() -> render() -> startLogic() -> createControls() -> updateState()
        // But I put updateState in init() above? Ah, slightly redundant but safe.
        // Let's rely on logic flow.
    }

    createControls() {
        ui.controls.innerHTML = `
            <button class="btn btn-danger" onclick="App.gameInstance.handleAction('swap')">🔄 交換 (Swap)</button>
            <button class="btn btn-primary" onclick="App.gameInstance.handleAction('next')">➡️ 下一組 (No Swap)</button>
        `;
    }

    updateState() {
        if (this.isComplete) return;

        // Clear previous styles
        document.querySelectorAll('.card').forEach(c => c.classList.remove('comparing'));

        let idx1, idx2;
        if (this.convergence === 'right') {
            // Standard: comparing j and j+1
            idx1 = this.j;
            idx2 = this.j + 1;
        } else {
            // Left Conv: comparing j and j-1
            idx1 = this.j - 1;
            idx2 = this.j;
        }

        const c1 = document.getElementById(`card-${idx1}`);
        const c2 = document.getElementById(`card-${idx2}`);
        if (c1) c1.classList.add('comparing');
        if (c2) c2.classList.add('comparing');

        this.setMessage(`比較 ${this.array[idx1]} 和 ${this.array[idx2]}：是否需要交換？`);
    }

    handleAction(action) {
        if (this.isComplete) return;

        let idx1, idx2; // indices in array
        if (this.convergence === 'right') {
            idx1 = this.j;
            idx2 = this.j + 1;
        } else {
            idx1 = this.j - 1;
            idx2 = this.j;
        }

        const leftVal = this.array[idx1];
        const rightVal = this.array[idx2];

        let shouldSwap = false;
        // Logic:
        // sortOrder 'asc' (Small -> Large) : if left > right, swap.
        // sortOrder 'desc' (Large -> Small): if left < right, swap.
        // This is equivalent to: if !shouldPrecede(left, right) && left != right ??
        // Simplify:
        // We want leftVal to be 'preceding' rightVal.
        // If shouldPrecede(leftVal, rightVal) is FALSE, and they are unequal, we swap?
        // Wait. 
        // Asc: 5, 3. shouldPrecede(5, 3) -> false (5 is not < 3). Swap needed? Yes.
        // Asc: 3, 5. shouldPrecede(3, 5) -> true. Swap needed? No.
        // Desc: 3, 5. shouldPrecede(3, 5) -> false (3 is not > 5). Swap needed? Yes.
        // Desc: 5, 3. shouldPrecede(5, 3) -> true. Swap needed? No.

        // However, we also need to handle equality. If equal, no swap.
        if (leftVal === rightVal) {
            shouldSwap = false;
        } else {
            shouldSwap = !this.shouldPrecede(leftVal, rightVal);
        }

        let correct = false;
        if (action === 'swap') {
            if (shouldSwap) correct = true;
            else return this.pulseError(`❌ 錯誤！目前順序正確，不需要交換。`);
        } else {
            if (!shouldSwap) correct = true;
            else return this.pulseError(`❌ 錯誤！順序不對，必須交換！`);
        }

        if (correct) {
            if (action === 'swap') {
                [this.array[idx1], this.array[idx2]] = [this.array[idx2], this.array[idx1]];
                this.render();
                document.getElementById(`card-${idx1}`).classList.add('flash');
                document.getElementById(`card-${idx2}`).classList.add('flash');
            } else {
                document.getElementById(`card-${idx1}`).classList.add('flash');
                document.getElementById(`card-${idx2}`).classList.add('flash');
            }
            setTimeout(() => this.nextStep(), this.stepDelay);
        }
    }

    pulseError(msg) {
        this.setMessage(msg, 'error');
        let idx1, idx2;
        if (this.convergence === 'right') { idx1 = this.j; idx2 = this.j + 1; }
        else { idx1 = this.j - 1; idx2 = this.j; }

        const c1 = document.getElementById(`card-${idx1}`);
        const c2 = document.getElementById(`card-${idx2}`);
        if (c1) c1.classList.add('shake');
        if (c2) c2.classList.add('shake');
        setTimeout(() => {
            if (c1) c1.classList.remove('shake');
            if (c2) c2.classList.remove('shake');
        }, 500);
    }

    nextStep() {
        if (this.convergence === 'right') {
            // Standard Bubble Up
            this.j++;
            // Limit: n - 1 - i
            if (this.j >= this.array.length - 1 - this.i) {
                // End of pass
                document.getElementById(`card-${this.array.length - 1 - this.i}`).classList.add('sorted');
                this.j = 0;
                this.i++;
            }

            if (this.i >= this.array.length - 1) {
                this.isComplete = true;
                this.playSuccess();
            } else {
                this.updateState();
            }
        } else {
            // Left Convergence Bubble Down
            this.j--;
            // Limit: i (since 0 to i-1 are sorted)
            // We compare j and j-1. So logic runs while j > i.
            // When j == i, we stop.

            if (this.j <= this.i) {
                // End of pass. Handled index 'i' is now sorted.
                // Wait, in bubble select, the element 'bubbled' to position 'i'.
                document.getElementById(`card-${this.i}`).classList.add('sorted');
                this.i++;
                // Reset j for next pass: starts at end
                this.j = this.array.length - 1;
            }

            if (this.i >= this.array.length - 1) {
                this.isComplete = true; // Optimization: last one is also sorted
                // Should mark last one sorted too?
                // If i == n-1, loop doesn't run.
                this.playSuccess();
            } else {
                this.updateState();
            }
        }
    }

    render() {
        super.render();
        // Add sorted classes based on simple loops
        // Note: nextStep logic adds 'sorted' class transiently, but full render resets it.
        // We need to re-apply 'sorted' to already sorted regions.

        if (this.convergence === 'right') {
            // Indices [n-i ... n-1] are sorted
            // i is number of sorted elements at end
            for (let k = 0; k < this.i; k++) {
                let idx = this.array.length - 1 - k;
                const card = document.getElementById(`card-${idx}`);
                if (card) card.classList.add('sorted');
            }
        } else {
            // Indices [0 ... i-1] are sorted
            for (let k = 0; k < this.i; k++) {
                const card = document.getElementById(`card-${k}`);
                if (card) card.classList.add('sorted');
            }
        }
    }
}

// --- Insertion Sort Implementation ---
class InsertionSortGame extends SortGame {
    constructor() {
        super("插入排序 (Insertion Sort)");
        this.boundary = 0; // Represents the boundary of the sorted region.
        // Left Conv: End of sorted (Inclusive). sorted [0..boundary]
        // Right Conv: Start of sorted (Inclusive). sorted [boundary..n-1]
    }

    init() {
        super.init();

        if (this.convergence === 'left') {
            this.boundary = 0;
            // Index 0 is initially sorted
            // We need to render first to clear old state, then add class
            this.render();
            const c0 = document.getElementById('card-0');
            if (c0) c0.classList.add('sorted');
        } else {
            this.boundary = this.array.length - 1;
            this.render();
            // Index n-1 is initially sorted
            const last = document.getElementById(`card-${this.array.length - 1}`);
            if (last) last.classList.add('sorted');
        }

        this.promptPick();
    }

    promptPick() {
        let completed = false;
        let pickIndex = -1;

        if (this.convergence === 'left') {
            if (this.boundary >= this.array.length - 1) completed = true;
            else pickIndex = this.boundary + 1;
        } else {
            if (this.boundary <= 0) completed = true;
            else pickIndex = this.boundary - 1;
        }

        if (completed) {
            this.isComplete = true;
            this.playSuccess();
            return;
        }

        this.setMessage("👆 請點擊「未排序區域」中最靠近已排序區域的那張卡片");
        const card = document.getElementById(`card-${pickIndex}`);
        if (card) {
            card.classList.add('clickable');
            card.onclick = () => this.handlePick(pickIndex);
        }
    }

    handlePick(index) {
        const card = document.getElementById(`card-${index}`);
        if (card) {
            card.onclick = null;
            card.classList.remove('clickable');
        }

        this.currentVal = this.array[index];
        this.currentIndex = index;

        this.setMessage(`📍 請在「已排序區域」中，點擊 ${this.currentVal} 應該插入的位置`);
        this.showSlots();
    }

    showSlots() {
        ui.board.innerHTML = '';

        // We need to render:
        // 1. Sorted Region with slots interspersed.
        // 2. The Selected Card (separate).
        // 3. The Remaining Unsorted Cards.

        // Use a container for the sorted+slots area
        const sortArea = document.createElement('div');
        sortArea.style.display = 'flex';
        sortArea.style.alignItems = 'center';
        sortArea.style.gap = '5px';
        ui.board.appendChild(sortArea);

        // Define loop range for sorted region
        let rangeStart = 0;
        let rangeEnd = 0;

        if (this.convergence === 'left') {
            rangeStart = 0;
            rangeEnd = this.boundary;

            // Generate slots and cards for [0 ... boundary]
            // Slot 0, Card 0, Slot 1, Card 1, ... , Slot k, Card k, Slot k+1
            for (let i = rangeStart; i <= rangeEnd; i++) {
                this.createSlot(sortArea, i); // Slot i (before card i)
                sortArea.appendChild(this.createCardElement(this.array[i], i, true));
            }
            this.createSlot(sortArea, rangeEnd + 1); // Final slot

        } else {
            // Right Convergence: Sorted is [boundary ... n-1]
            rangeStart = this.boundary;
            rangeEnd = this.array.length - 1;

            // Generate slots and cards for [boundary ... n-1]
            // Slot boundary, Card boundary, ...
            for (let i = rangeStart; i <= rangeEnd; i++) {
                this.createSlot(sortArea, i);
                sortArea.appendChild(this.createCardElement(this.array[i], i, true));
            }
            this.createSlot(sortArea, rangeEnd + 1);
        }

        // Selected Card Container
        const selectedContainer = document.createElement('div');
        selectedContainer.style.marginLeft = '20px';
        selectedContainer.style.marginRight = '20px'; // spacing
        selectedContainer.style.display = 'flex';
        selectedContainer.style.gap = '15px';
        selectedContainer.style.alignItems = 'center';

        const selected = this.createCardElement(this.currentVal, this.currentIndex);
        selected.classList.add('selected');
        selectedContainer.appendChild(selected);

        // Remaining Unsorted
        // Left Conv: [boundary+2 ... n-1] (since boundary+1 is picked)
        // Right Conv: [0 ... boundary-2] (since boundary-1 is picked)

        let unsortedStart, unsortedEnd;
        if (this.convergence === 'left') {
            unsortedStart = this.currentIndex + 1;
            unsortedEnd = this.array.length - 1;
            // Append SortedArea then Selected then Unsorted
            ui.board.appendChild(selectedContainer);
            const unsortedArea = document.createElement('div');
            unsortedArea.style.display = 'flex'; unsortedArea.style.gap = '5px';
            for (let i = unsortedStart; i <= unsortedEnd; i++) {
                unsortedArea.appendChild(this.createCardElement(this.array[i], i));
            }
            ui.board.appendChild(unsortedArea);

        } else {
            unsortedStart = 0;
            unsortedEnd = this.currentIndex - 1;

            // Order: Unsorted -> Selected -> SortedArea
            // Clean ui.board first actually, the logic above appended sortArea first.
            // Let's restructure.
            ui.board.innerHTML = '';

            const unsortedArea = document.createElement('div');
            unsortedArea.style.display = 'flex'; unsortedArea.style.gap = '5px';
            for (let i = unsortedStart; i <= unsortedEnd; i++) {
                unsortedArea.appendChild(this.createCardElement(this.array[i], i));
            }
            ui.board.appendChild(unsortedArea);

            ui.board.appendChild(selectedContainer);
            ui.board.appendChild(sortArea); // The sorted area we built earlier
        }
    }

    createSlot(container, insertIndex) {
        const slot = document.createElement('div');
        slot.className = 'slot active';
        slot.style.width = '20px'; // Ensure visibility
        slot.onclick = () => this.handleInsert(insertIndex);
        container.appendChild(slot);
    }

    createCardElement(num, index, isSorted = false) {
        const div = super.createCardElement(num, index);
        if (isSorted) div.classList.add('sorted');
        return div;
    }

    handleInsert(slotIndex) {
        // Validation Logic
        // We are inserting this.currentVal into a sorted array.
        // We must ensure that the element at slotIndex-1 (if exists) < currentVal
        // AND element at slotIndex (if exists) > currentVal.
        // (Assuming Asc order)
        // Generalized: shoudPrecede(prev, current) && shouldPrecede(current, next)

        // Find adjacent values in the current array state (conceptually)
        // Note: slotIndex refers to the position *in the original array indices*.
        // But since we are visualizing a subset (the sorted region), it maps directly.
        // E.g. Sorted region indices [0, 1, 2]. Slot 1 is between 0 and 1.

        // However, 'slotIndex' passed from createSlot() is the raw index where we propose to insert.
        // Let's look at neighboring val usage.

        // Need to check neighbors WITHIN the sorted region.
        // Neighbor Left: array[slotIndex - 1] (if slotIndex-1 is inside sorted region)
        // Neighbor Right: array[slotIndex] (if slotIndex is inside sorted region)

        let valid = true;

        // Check Preceding neighbor (index = slotIndex - 1)
        // It must exist and be part of the sorted set.
        // In Left Conv: sorted is [0...boundary]. If slotIndex > 0, neighbor is slotIndex-1.
        // In Right Conv: sorted is [boundary...n-1]. If slotIndex > boundary, neighbor is slotIndex-1.

        let prevIndex = slotIndex - 1;
        let nextIndex = slotIndex;

        // Check Prev
        // Condition: if prev exists in sorted region, then shouldPrecede(arr[prev], current) must be true.
        // If equal? Insert Sort is stable, usually insert *after* equal elements (from right pick) or *after* (from left pick)?
        // Picked from Right (currentIndex > sorted). Moving Left. Insert after equal?
        // Let's stick to strict inequality for automated checks or allow flexibility?
        // Simplest: Loop through sorted region, find the first place where element > currentVal.

        let correctSlot = -1;

        if (this.convergence === 'left') {
            // Region [0 ... boundary]
            // We want to find index k such that all elements before k are <= current (Asc)
            // and all elements at k and after are > current.
            // i.e. First element where shouldPrecede(current, element) is true.

            // Loop i from 0 to boundary
            correctSlot = this.boundary + 1; // Default: end of region
            for (let i = 0; i <= this.boundary; i++) {
                // If current should precede array[i]
                if (this.shouldPrecede(this.currentVal, this.array[i])) {
                    correctSlot = i;
                    break;
                }
            }
        } else {
            // Region [boundary ... n-1]
            // We want index k.
            // Loop i from boundary to n-1. 
            // Same logic? First element where current should precede it?

            correctSlot = this.array.length; // Default: after last element (n)

            // But wait, slots start at 'boundary'.
            // if boundary=3, sorted indices 3,4.
            // Slots: 3 (before 3), 4 (before 4), 5 (after 4).

            for (let i = this.boundary; i < this.array.length; i++) {
                if (this.shouldPrecede(this.currentVal, this.array[i])) {
                    correctSlot = i;
                    break;
                }
            }
        }

        if (slotIndex === correctSlot) {
            this.setMessage("✅ 正確！插入成功", 'success');

            // Update Array
            // Use local variable for splice to avoid confusion
            const val = this.array[this.currentIndex];
            this.array.splice(this.currentIndex, 1); // Remove current

            // Adjust insertion index if necessary
            // If we are inserting to the right of where we removed, the target index has shifted left by 1.
            let insertAt = slotIndex;
            if (slotIndex > this.currentIndex) {
                insertAt--;
            }

            this.array.splice(insertAt, 0, val);

            if (this.convergence === 'left') {
                this.boundary++;
            } else {
                this.boundary--;
            }

            this.render();

            // Mark sorted
            if (this.convergence === 'left') {
                for (let i = 0; i <= this.boundary; i++) document.getElementById(`card-${i}`).classList.add('sorted');
            } else {
                for (let i = this.boundary; i < this.array.length; i++) document.getElementById(`card-${i}`).classList.add('sorted');
            }

            setTimeout(() => this.promptPick(), this.stepDelay);
        } else {
            this.setMessage(`❌ 錯誤！${this.currentVal} 不應該放在這裡`, 'error');
            // Shake board or sortArea
            const container = ui.board.querySelector('div'); // heuristic
            if (container) {
                container.classList.add('shake');
                setTimeout(() => container.classList.remove('shake'), 500);
            }
        }
    }
}

// --- Selection Sort Implementation ---
class SelectionSortGame extends SortGame {
    constructor() {
        super("選擇排序 (Selection Sort)");
        this.sortedIndex = 0;
    }

    init() {
        super.init();
        if (this.convergence === 'left') {
            this.sortedIndex = 0;
        } else {
            this.sortedIndex = this.array.length - 1;
        }
        // Always render after updating state to ensure clean board
        this.render();
        this.promptFindTarget();
    }

    promptFindTarget() {
        // Check completion
        let completed = false;
        if (this.convergence === 'left') {
            if (this.sortedIndex >= this.array.length - 1) completed = true;
        } else {
            if (this.sortedIndex <= 0) completed = true;
        }

        if (completed) {
            this.isComplete = true;
            this.render();
            // Just ensure everything is marked sorted
            document.querySelectorAll('.card').forEach(c => c.classList.add('sorted'));
            this.playSuccess();
            return;
        }

        // Determine range and label
        let start, end, labelType;
        if (this.convergence === 'left') {
            // Find "First" (Min if Asc) in [sortedIndex ... n-1]
            start = this.sortedIndex;
            end = this.array.length - 1;
            // Asc: Find Min. Desc: Find Max.
            labelType = (this.sortOrder === 'asc') ? '最小值' : '最大值';
        } else {
            // Find "Last" (Max if Asc) in [0 ... sortedIndex]
            start = 0;
            end = this.sortedIndex;
            // Asc ([Small ... Large]): We want Max at right.
            // Desc ([Large ... Small]): We want Min at right.
            labelType = (this.sortOrder === 'asc') ? '最大值' : '最小值';
        }

        this.setMessage(`🔍 回合 ${this.convergence === 'left' ? this.sortedIndex + 1 : this.array.length - this.sortedIndex}: 請找出未排序區域（白色卡片）中的「${labelType}」`);

        // Make range clickable
        for (let i = start; i <= end; i++) {
            const card = document.getElementById(`card-${i}`);
            if (card) {
                card.classList.add('clickable');
                card.onclick = () => this.handleSelection(i);
            }
        }
    }

    handleSelection(index) {
        document.querySelectorAll('.clickable').forEach(el => {
            el.classList.remove('clickable');
            el.onclick = null;
        });

        const pickedVal = this.array[index];
        let correctIdx = -1;
        let correctVal = null;

        // Determine Correct Target
        if (this.convergence === 'left') {
            // Find element that should comes FIRST among unsorted
            // i.e. element X such that shouldPrecede(X, Y) is true for all Y
            let bestIdx = this.sortedIndex;
            let bestVal = this.array[this.sortedIndex];

            for (let i = this.sortedIndex + 1; i < this.array.length; i++) {
                // If array[i] should precede bestVal, update
                if (this.shouldPrecede(this.array[i], bestVal)) {
                    bestVal = this.array[i];
                    bestIdx = i;
                }
            }
            correctIdx = bestIdx;
            correctVal = bestVal;

        } else {
            // Right Convergence
            // Find element that should comes LAST among unsorted
            // i.e. element X such that shouldPrecede(Y, X) is true for all Y
            // Equivalent to finding "Max" if Asc, "Min" if Desc

            let bestIdx = 0;
            let bestVal = this.array[0];

            for (let i = 1; i <= this.sortedIndex; i++) {
                // We want the one that is "Greatest" (comes last)
                // If shouldPrecede(bestVal, array[i]) is true, then array[i] comes after bestVal -> array[i] is new candidate
                if (this.shouldPrecede(bestVal, this.array[i])) {
                    bestVal = this.array[i];
                    bestIdx = i;
                }
            }
            correctIdx = bestIdx;
            correctVal = bestVal;
        }

        if (index === correctIdx) { // Compare indices to handle duplicate values deterministically
            const card = document.getElementById(`card-${index}`);
            card.classList.add('selected');
            this.setMessage(`✅ 正確！目標是 ${correctVal}，正在交換...`, 'success');

            setTimeout(() => {
                // Swap with sortedIndex
                [this.array[this.sortedIndex], this.array[index]] = [this.array[index], this.array[this.sortedIndex]];
                this.render();

                // Mark sorted regions
                if (this.convergence === 'left') {
                    this.sortedIndex++;
                } else {
                    this.sortedIndex--;
                }
                this.render(); // Re-render to update sorted classes logic in main loop?
                // Actually render() calls super.render() which is empty-ish loop wise.
                // We need custom render logic or just rely on next prompt to set classes?
                // Let's simplify: render() just draws numbers. We add 'sorted' manually?
                // Better: Update render() in SortGame or override here?
                // Override here is safest.

                setTimeout(() => this.promptFindTarget(), this.stepDelay);
            }, 800);

        } else {
            // Find the actual correct value for the error message
            // Wait, I already calculated correctVal.
            // But if user picked a duplicate that IS valid ... indices might differ.
            // Wait. If values are same, it is technically correct.
            // My check `index === correctIdx` enforces stability/specific instance.
            // Let's relax: if `pickedVal === correctVal` -> Correct.

            if (pickedVal === correctVal) {
                // Allow it. Recalculate swapping logic if needed using `index`.
                // It works fine.
                const card = document.getElementById(`card-${index}`);
                card.classList.add('selected');
                this.setMessage(`✅ 正確！目標是 ${correctVal}，正在交換...`, 'success');

                setTimeout(() => {
                    [this.array[this.sortedIndex], this.array[index]] = [this.array[index], this.array[this.sortedIndex]];
                    this.render();
                    if (this.convergence === 'left') this.sortedIndex++;
                    else this.sortedIndex--;
                    setTimeout(() => this.promptFindTarget(), this.stepDelay);
                }, 800);

            } else {
                this.setMessage(`❌ 錯誤！${pickedVal} 不是目標 (目標是 ${correctVal})`, 'error');
                const card = document.getElementById(`card-${index}`);
                card.classList.add('shake');
                setTimeout(() => {
                    card.classList.remove('shake');
                    this.promptFindTarget();
                }, 500);
            }
        }
    }

    render() {
        super.render();
        if (this.convergence === 'left') {
            for (let i = 0; i < this.sortedIndex; i++) {
                const card = document.getElementById(`card-${i}`);
                if (card) card.classList.add('sorted');
            }
        } else {
            // Sorted is from sortedIndex + 1 to end
            for (let i = this.array.length - 1; i > this.sortedIndex; i--) {
                const card = document.getElementById(`card-${i}`);
                if (card) card.classList.add('sorted');
            }
        }
    }
}

// Initial Listener
ui.btnBack.addEventListener('click', backToMenu);

// Make functions global
window.startGame = startGame;
window.backToMenu = backToMenu;
