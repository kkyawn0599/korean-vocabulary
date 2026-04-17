// 当前单词索引
let currentWordIndex = 0;
// 乱序单词数组
let shuffledWords = [];
// 当前选中的词书
let currentBook = '默认词书';

// 初始化页面
function init() {
    // 检查URL参数，看是否有同步数据
    checkSyncData();
    
    // 加载单词数据
    loadWords();
    
    // 初始化词书选择
    initBookSelection();
    
    // 初始化乱序单词
    shuffleWords();
    
    // 绑定事件监听器
    document.getElementById('importBtn').addEventListener('click', importWords);
    document.getElementById('showBtn').addEventListener('click', toggleCard);
    document.getElementById('prevBtn').addEventListener('click', prevWord);
    document.getElementById('nextBtn').addEventListener('click', nextWord);
    document.getElementById('playBtn').addEventListener('click', playPronunciation);
    
    // 绑定同步功能事件
    document.getElementById('exportBtn').addEventListener('click', exportWords);
    document.getElementById('importFileBtn').addEventListener('click', function() {
        document.getElementById('fileInput').click();
    });
    document.getElementById('fileInput').addEventListener('change', importFromFile);
    document.getElementById('syncBtn').addEventListener('click', generateSyncLink);
    
    // 绑定词书相关事件
    document.getElementById('addBookBtn').addEventListener('click', addBook);
    document.getElementById('bookSelect').addEventListener('change', function() {
        currentBook = this.value;
        shuffleWords();
        currentWordIndex = 0;
        showWord(currentWordIndex);
        updateWordList();
    });
    
    // 绑定卡片点击事件
    const card = document.querySelector('.word-card');
    card.addEventListener('click', toggleCard);
    
    // 防止播放按钮触发卡片翻转
    document.getElementById('playBtn').addEventListener('click', function(e) {
        e.stopPropagation();
    });
    
    // 显示第一个单词
    showWord(currentWordIndex);
    
    // 更新单词列表
    updateWordList();
    
    // 更新词书列表
    updateBookList();
}

// 初始化词书选择
function initBookSelection() {
    const bookSelect = document.getElementById('bookSelect');
    bookSelect.innerHTML = '';
    
    books.forEach(book => {
        const option = document.createElement('option');
        option.value = book;
        option.textContent = book;
        if (book === currentBook) {
            option.selected = true;
        }
        bookSelect.appendChild(option);
    });
}

// 添加词书
function addBook() {
    const bookName = prompt('请输入词书名称：');
    if (bookName && bookName.trim()) {
        if (!books.includes(bookName.trim())) {
            books.push(bookName.trim());
            saveWords();
            initBookSelection();
            updateBookList();
            alert('词书添加成功！');
        } else {
            alert('词书名称已存在！');
        }
    }
}

// 更新词书列表
function updateBookList() {
    const bookList = document.getElementById('bookList');
    bookList.innerHTML = '';
    
    books.forEach(book => {
        const bookItem = document.createElement('div');
        bookItem.className = 'book-item';
        
        // 统计该词书的单词数量
        const bookWordCount = words.filter(word => word.book === book).length;
        
        bookItem.innerHTML = `
            <h3>${book}</h3>
            <p>单词数量：${bookWordCount}</p>
            <button class="study-btn" onclick="selectBook('${book}')">开始学习</button>
            <button class="delete-btn" onclick="deleteBook('${book}')">删除</button>
        `;
        
        bookList.appendChild(bookItem);
    });
}

// 选择词书
function selectBook(book) {
    currentBook = book;
    document.getElementById('bookSelect').value = book;
    shuffleWords();
    currentWordIndex = 0;
    showWord(currentWordIndex);
    updateWordList();
}

// 删除词书
function deleteBook(book) {
    if (book === '默认词书') {
        alert('默认词书不能删除！');
        return;
    }
    
    if (confirm(`确定要删除词书「${book}」吗？该词书中的所有单词也会被删除。`)) {
        // 删除词书中的单词
        words = words.filter(word => word.book !== book);
        // 删除词书
        books = books.filter(b => b !== book);
        // 保存数据
        saveWords();
        // 更新界面
        initBookSelection();
        updateBookList();
        updateWordList();
        // 如果当前选中的词书被删除，切换到默认词书
        if (currentBook === book) {
            currentBook = '默认词书';
            shuffleWords();
            currentWordIndex = 0;
            showWord(currentWordIndex);
        }
        alert('词书删除成功！');
    }
}

// 检查URL参数中的同步数据
function checkSyncData() {
    const urlParams = new URLSearchParams(window.location.search);
    const syncData = urlParams.get('sync');
    
    if (syncData) {
        try {
            const decodedData = atob(syncData);
            const importedWords = JSON.parse(decodedData);
            
            if (Array.isArray(importedWords)) {
                words = importedWords;
                saveWords();
                shuffleWords();
                alert('单词同步成功！');
            }
        } catch (error) {
            console.error('同步数据解析失败:', error);
        }
    }
}

// 生成同步链接
function generateSyncLink() {
    const dataStr = JSON.stringify(words);
    const encodedData = btoa(dataStr);
    const syncUrl = `${window.location.origin}${window.location.pathname}?sync=${encodedData}`;
    
    // 复制链接到剪贴板
    navigator.clipboard.writeText(syncUrl).then(() => {
        alert('同步链接已复制到剪贴板，请在其他设备上打开该链接以同步单词！');
    }).catch(err => {
        console.error('复制失败:', err);
        // 如果复制失败，显示链接
        prompt('请复制以下链接到其他设备:', syncUrl);
    });
}

// 打乱单词顺序
function shuffleWords() {
    // 筛选当前词书的单词索引
    const bookWordIndices = words
        .map((_, index) => index)
        .filter(index => words[index].book === currentBook);
    
    // 打乱索引
    for (let i = bookWordIndices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [bookWordIndices[i], bookWordIndices[j]] = [bookWordIndices[j], bookWordIndices[i]];
    }
    
    shuffledWords = bookWordIndices;
    console.log('打乱后的单词顺序:', shuffledWords);
}

// 导出单词
function exportWords() {
    const dataStr = JSON.stringify(words, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'korean_words.json';
    link.click();
    URL.revokeObjectURL(url);
}

// 从文件导入单词
function importFromFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedWords = JSON.parse(e.target.result);
            if (Array.isArray(importedWords)) {
                words = importedWords;
                saveWords();
                // 重新打乱单词顺序
                shuffleWords();
                updateWordList();
                showWord(0);
                alert('单词导入成功！');
            } else {
                alert('文件格式错误！');
            }
        } catch (error) {
            alert('文件解析失败！');
        }
    };
    reader.readAsText(file);
    
    // 重置文件输入
    e.target.value = '';
}

// 导入单词
function importWords() {
    const input = document.getElementById('wordInput').value;
    console.log('输入内容:', input);
    
    if (!input.trim()) {
        alert('请输入单词！');
        return;
    }
    
    const lines = input.trim().split('\n');
    console.log('分割后的行数量:', lines.length);
    console.log('分割后的行:', lines);
    
    let addedCount = 0;
    let updatedCount = 0;
    lines.forEach((line, index) => {
        console.log(`处理第 ${index + 1} 行: ${line}`);
        
        if (line.trim()) {
            // 尝试用不同的分隔符分割
            let parts = line.split(',');
            if (parts.length < 2) {
                parts = line.split('，'); // 中文逗号
            }
            if (parts.length < 2) {
                parts = line.split(' '); // 空格
            }
            
            console.log('分割后的部分:', parts);
            
            if (parts.length >= 2) {
                const korean = parts[0].trim();
                const chinese = parts[1].trim();
                const pronunciation = parts[2] ? parts[2].trim() : '';
                
                // 查找是否已存在相同的单词（同一词书内）
                const existingIndex = words.findIndex(word => word.korean === korean && word.book === currentBook);
                
                if (existingIndex === -1) {
                    // 不存在，添加新单词
                    words.push({ korean, chinese, pronunciation, book: currentBook });
                    addedCount++;
                    console.log('添加的单词:', { korean, chinese, pronunciation, book: currentBook });
                } else {
                    // 存在，检查中文意思是否相同
                    if (words[existingIndex].chinese !== chinese) {
                        // 意思不同，合并
                        words[existingIndex].chinese += `；${chinese}`;
                        // 如果有新的发音，更新发音
                        if (pronunciation) {
                            words[existingIndex].pronunciation = pronunciation;
                        }
                        updatedCount++;
                        console.log('更新的单词:', words[existingIndex]);
                    } else {
                        // 意思相同，跳过
                        console.log('重复单词，意思相同，跳过:', korean);
                    }
                }
            } else {
                console.log('格式不正确，跳过此行');
            }
        } else {
            console.log('空行，跳过');
        }
    });
    
    console.log('添加的单词数量:', addedCount);
    console.log('更新的单词数量:', updatedCount);
    console.log('当前单词列表:', words);
    
    // 保存单词
    saveWords();
    console.log('单词已保存到本地存储');
    
    // 重新打乱单词顺序
    shuffleWords();
    
    // 清空输入框
    document.getElementById('wordInput').value = '';
    
    // 更新单词列表
    updateWordList();
    console.log('单词列表已更新');
    
    // 显示最新导入的单词
    if (words.length > 0) {
        currentWordIndex = 0; // 从打乱后的第一个单词开始
        showWord(currentWordIndex);
        console.log('显示最新导入的单词');
    }
    
    // 显示成功消息
    if (addedCount > 0 || updatedCount > 0) {
        alert(`成功导入 ${addedCount} 个单词，更新 ${updatedCount} 个单词！`);
    } else {
        alert('没有导入任何单词，请检查输入格式！');
    }
}

// 显示单词
function showWord(index) {
    if (words.length === 0) return;
    
    // 使用乱序单词数组
    const actualIndex = shuffledWords[index];
    const word = words[actualIndex];
    document.getElementById('koreanWord').textContent = word.korean;
    document.getElementById('chineseMeaning').textContent = word.chinese;
    document.getElementById('pronunciation').textContent = word.pronunciation;
    
    // 重置卡片状态
    const card = document.querySelector('.word-card');
    card.classList.remove('flipped');
}

// 翻转卡片
function toggleCard() {
    const card = document.querySelector('.word-card');
    card.classList.toggle('flipped');
}

// 上一个单词
function prevWord() {
    if (words.length === 0) return;
    
    currentWordIndex = (currentWordIndex - 1 + shuffledWords.length) % shuffledWords.length;
    showWord(currentWordIndex);
}

// 下一个单词
function nextWord() {
    if (words.length === 0) return;
    
    currentWordIndex = (currentWordIndex + 1) % shuffledWords.length;
    showWord(currentWordIndex);
}

// 播放发音
function playPronunciation() {
    if (words.length === 0) return;
    
    const word = words[currentWordIndex];
    const utterance = new SpeechSynthesisUtterance(word.korean);
    utterance.lang = 'ko-KR'; // 设置为韩语
    speechSynthesis.speak(utterance);
}

// 更新单词列表
function updateWordList() {
    const wordList = document.getElementById('wordList');
    wordList.innerHTML = '';
    
    // 只显示当前词书的单词
    const bookWords = words.filter(word => word.book === currentBook);
    
    bookWords.forEach((word, index) => {
        const wordItem = document.createElement('div');
        wordItem.className = 'word-item';
        
        // 找到单词在原始数组中的索引
        const originalIndex = words.findIndex(w => w.korean === word.korean && w.book === word.book);
        
        wordItem.innerHTML = `
            <div class="korean">${word.korean}</div>
            <div class="chinese">${word.chinese}</div>
            <div class="pronunciation">${word.pronunciation}</div>
            <button class="delete-word-btn" onclick="deleteWord(${originalIndex})">删除</button>
        `;
        
        // 点击单词项跳转到该单词
        wordItem.addEventListener('click', (e) => {
            // 防止点击删除按钮时触发单词选择
            if (!e.target.classList.contains('delete-word-btn')) {
                // 找到该单词在shuffledWords中的索引
                const shuffledIndex = shuffledWords.indexOf(originalIndex);
                if (shuffledIndex !== -1) {
                    currentWordIndex = shuffledIndex;
                    showWord(currentWordIndex);
                }
            }
        });
        
        wordList.appendChild(wordItem);
    });
}

// 删除单词
function deleteWord(index) {
    if (confirm(`确定要删除单词「${words[index].korean}」吗？`)) {
        words.splice(index, 1);
        saveWords();
        shuffleWords();
        updateWordList();
        // 如果删除的是当前显示的单词，显示下一个
        if (currentWordIndex >= shuffledWords.length) {
            currentWordIndex = 0;
        }
        showWord(currentWordIndex);
        alert('单词删除成功！');
    }
}

// 页面加载完成后初始化
window.addEventListener('DOMContentLoaded', init);