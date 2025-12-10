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

        console.log("Generating array of size:", size);
        this.array = this.generateRandomArray(size);
        this.isComplete = false;
        this.render();
        this.startLogic();
    }

    generateRandomArray(size) {
        // Generate numbers between 1 and 99
        return Array.from({ length: size }, () => Math.floor(Math.random() * 99) + 1);
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
        this.j = 0;
        super.init();
    }

    startLogic() {
        this.createControls();
        this.updateState();
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

        // Highlight current pair
        const c1 = document.getElementById(`card-${this.j}`);
        const c2 = document.getElementById(`card-${this.j + 1}`);
        if (c1) c1.classList.add('comparing');
        if (c2) c2.classList.add('comparing');

        this.setMessage(`比較 ${this.array[this.j]} 和 ${this.array[this.j + 1]}：是否需要交換？`);
    }

    handleAction(action) {
        if (this.isComplete) return;
        const left = this.array[this.j];
        const right = this.array[this.j + 1];

        let correct = false;
        if (action === 'swap') {
            if (left > right) correct = true;
            else return this.pulseError(`❌ 錯誤！${left} 不大於 ${right}，不需要交換。`);
        } else {
            if (left <= right) correct = true;
            else return this.pulseError(`❌ 錯誤！${left} 大於 ${right}，必須交換！`);
        }

        if (correct) {
            if (action === 'swap') {
                [this.array[this.j], this.array[this.j + 1]] = [this.array[this.j + 1], this.array[this.j]];
                this.render();
                document.getElementById(`card-${this.j}`).classList.add('flash');
                document.getElementById(`card-${this.j + 1}`).classList.add('flash');
            } else {
                document.getElementById(`card-${this.j}`).classList.add('flash');
                document.getElementById(`card-${this.j + 1}`).classList.add('flash');
            }
            setTimeout(() => this.nextStep(), this.stepDelay);
        }
    }

    pulseError(msg) {
        this.setMessage(msg, 'error');
        const c1 = document.getElementById(`card-${this.j}`);
        const c2 = document.getElementById(`card-${this.j + 1}`);
        c1.classList.add('shake');
        c2.classList.add('shake');
        setTimeout(() => {
            c1.classList.remove('shake');
            c2.classList.remove('shake');
        }, 500);
    }

    nextStep() {
        this.j++;
        if (this.j >= this.array.length - 1 - this.i) {
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
    }

    render() {
        super.render();
        for (let k = 0; k < this.i; k++) {
            let idx = this.array.length - 1 - k;
            const card = document.getElementById(`card-${idx}`);
            if (card) card.classList.add('sorted');
        }
    }
}

// --- Insertion Sort Implementation ---
class InsertionSortGame extends SortGame {
    constructor() {
        super("插入排序 (Insertion Sort)");
        this.sortedEndIndex = 0;
    }

    init() {
        this.sortedEndIndex = 0;
        super.init();
        // Index 0 is initially sorted
        const c0 = document.getElementById('card-0');
        if (c0) c0.classList.add('sorted');
        this.promptPick();
    }

    promptPick() {
        if (this.sortedEndIndex >= this.array.length - 1) {
            this.isComplete = true;
            this.playSuccess();
            return;
        }
        this.setMessage("👆 請點擊「未排序區域」的第一張卡片");
        const targetIndex = this.sortedEndIndex + 1;
        const card = document.getElementById(`card-${targetIndex}`);
        if (card) {
            card.classList.add('clickable');
            card.onclick = () => this.handlePick(targetIndex);
        }
    }

    handlePick(index) {
        const card = document.getElementById(`card-${index}`);
        card.onclick = null;
        card.classList.remove('clickable');
        card.classList.add('selected');

        this.currentVal = this.array[index];
        this.currentIndex = index;

        this.setMessage(`📍 請在左側「已排序區域」中，點擊 ${this.currentVal} 應該插入的位置`);
        this.showSlots();
    }

    showSlots() {
        ui.board.innerHTML = '';

        // 1. Slots and Sorted Cards
        for (let i = 0; i <= this.sortedEndIndex; i++) {
            this.createSlot(i);
            ui.board.appendChild(this.createCardElement(this.array[i], i, true));
        }
        // Final slot
        this.createSlot(this.sortedEndIndex + 1);

        // 2. The Selected Card
        const selectedContainer = document.createElement('div');
        selectedContainer.style.marginLeft = '20px';
        selectedContainer.style.display = 'flex';
        selectedContainer.style.gap = '15px';
        selectedContainer.style.alignItems = 'center';

        const selected = this.createCardElement(this.currentVal, this.currentIndex);
        selected.classList.add('selected');
        selectedContainer.appendChild(selected);

        // 3. The rest
        for (let i = this.currentIndex + 1; i < this.array.length; i++) {
            selectedContainer.appendChild(this.createCardElement(this.array[i], i));
        }

        ui.board.appendChild(selectedContainer);
    }

    createSlot(insertIndex) {
        const slot = document.createElement('div');
        slot.className = 'slot active';
        slot.onclick = () => this.handleInsert(insertIndex);
        ui.board.appendChild(slot);
    }

    createCardElement(num, index, isSorted = false) {
        const div = super.createCardElement(num, index);
        if (isSorted) div.classList.add('sorted');
        return div;
    }

    handleInsert(slotIndex) {
        let correctSlot = 0;
        for (let i = 0; i <= this.sortedEndIndex; i++) {
            if (this.currentVal < this.array[i]) {
                correctSlot = i;
                break;
            }
            correctSlot = i + 1;
        }

        if (slotIndex === correctSlot) {
            this.setMessage("✅ 正確！插入成功", 'success');
            const val = this.array.splice(this.currentIndex, 1)[0];
            this.array.splice(slotIndex, 0, val);
            this.sortedEndIndex++;
            this.render();
            for (let i = 0; i <= this.sortedEndIndex; i++) {
                document.getElementById(`card-${i}`).classList.add('sorted');
            }
            setTimeout(() => this.promptPick(), this.stepDelay);
        } else {
            this.setMessage(`❌ 錯誤！${this.currentVal} 不應該放在這裡`, 'error');
            ui.board.classList.add('shake');
            setTimeout(() => ui.board.classList.remove('shake'), 500);
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
        this.sortedIndex = 0;
        super.init();
        this.promptFindMin();
    }

    promptFindMin() {
        if (this.sortedIndex >= this.array.length - 1) {
            this.isComplete = true;
            this.render();
            this.playSuccess();
            return;
        }

        this.setMessage(`🔍 回合 ${this.sortedIndex + 1}: 請找出未排序區域（白色卡片）中的「最小值」`);

        for (let i = this.sortedIndex; i < this.array.length; i++) {
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

        let minVal = this.array[this.sortedIndex];
        let minIdx = this.sortedIndex;

        for (let i = this.sortedIndex + 1; i < this.array.length; i++) {
            if (this.array[i] < minVal) {
                minVal = this.array[i];
                minIdx = i;
            }
        }

        const pickedVal = this.array[index];

        if (pickedVal === minVal) {
            const card = document.getElementById(`card-${index}`);
            card.classList.add('selected');
            this.setMessage(`✅ 正確！最小值是 ${minVal}，正在交換...`, 'success');

            setTimeout(() => {
                [this.array[this.sortedIndex], this.array[index]] = [this.array[index], this.array[this.sortedIndex]];
                this.render();
                document.getElementById(`card-${this.sortedIndex}`).classList.add('sorted');
                for (let k = 0; k < this.sortedIndex; k++) document.getElementById(`card-${k}`).classList.add('sorted');
                this.sortedIndex++;
                setTimeout(() => this.promptFindMin(), this.stepDelay);
            }, 800);

        } else {
            this.setMessage(`❌ 錯誤！${pickedVal} 不是目前的最小值 (最小值是 ${minVal})`, 'error');
            const card = document.getElementById(`card-${index}`);
            card.classList.add('shake');
            setTimeout(() => {
                card.classList.remove('shake');
                this.promptFindMin();
            }, 500);
        }
    }

    render() {
        super.render();
        for (let i = 0; i < this.sortedIndex; i++) {
            const card = document.getElementById(`card-${i}`);
            if (card) card.classList.add('sorted');
        }
    }
}

// Initial Listener
ui.btnBack.addEventListener('click', backToMenu);

// Make functions global
window.startGame = startGame;
window.backToMenu = backToMenu;
