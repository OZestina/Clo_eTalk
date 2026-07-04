document.addEventListener('DOMContentLoaded', () => {
    const qlueMessage = document.getElementById('qlue-message');
    const questionBanner = document.getElementById('question-banner');
    
    const views = {
        0: document.getElementById('view-0-settings'),
        1: document.getElementById('view-1-input'),
        2: document.getElementById('view-2-builder'),
        3: document.getElementById('view-3-typing'),
        4: document.getElementById('view-4-hangman-word'),
        5: document.getElementById('view-5-hangman-sentence'),
        6: document.getElementById('view-6-summary')
    };

    // 인터뷰 유기적 제어 변수군
    let REPETITIONS = 2; 
    let userInterests = ""; 
    let questionRound = 1; 
    
    let currentQuestion = "Tell me about your favorite cafe.";
    let finalSentence = "";
    let practicePhrases = []; 
    let currentPhraseIndex = 0;
    let currentRep = 1;

    // 공통 유틸리티: 문자열 일치 검사 및 스마트 브레이크 인덱스 반환
    function getCorrectPrefixLength(target, input) {
        const t = target.toLowerCase();
        const i = input.toLowerCase();
        let len = 0;
        while (len < i.length && len < t.length && t[len] === i[len]) {
            len++;
        }
        return len;
    }

    function generateSentenceBlanks(sentence, correctLen) {
        const correctPart = sentence.substring(0, correctLen);
        const remainingPart = sentence.substring(correctLen);
        const blanks = remainingPart.replace(/[a-zA-Z0-9]/g, "_");
        return `<span style="color: #2ecc71; font-weight: bold;">${correctPart}</span><span class="target-highlight">${blanks}</span>`;
    }

    // --- View 0: 설정 세이브 및 첫 구동 ---
    document.getElementById('btn-save-settings').addEventListener('click', () => {
        const interestsInput = document.getElementById('settings-interests').value.trim();
        const repsInput = document.getElementById('settings-reps').value;

        userInterests = interestsInput || "general topics";
        REPETITIONS = parseInt(repsInput, 10);

        document.getElementById('header-progress').textContent = `Q ${questionRound}/3`;
        switchView(0, 1);
        qlueMessage.textContent = `Excellent! Let's start the interview. ${currentQuestion}`;
    });

    // --- View 1 -> View 2 (제출 및 API 통신) ---
    document.getElementById('btn-submit').addEventListener('click', async () => {
        const userAnswer = document.getElementById('user-answer').value.trim();
        if (!userAnswer) return alert("답변을 입력해주세요!");

        document.getElementById('btn-submit').disabled = true;
        document.getElementById('loading-spinner').classList.remove('hidden');
        qlueMessage.textContent = "Hmm, let me analyze your sentence... 🔍";

        try {
            const res = await fetch('http://localhost:3000/api/correct', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ question: currentQuestion, userAnswer })
            });
            const result = await res.json();
            renderView2(result.data);
        } catch (error) {
            alert("서버 통신 실패!");
        } finally {
            document.getElementById('btn-submit').disabled = false;
            document.getElementById('loading-spinner').classList.add('hidden');
        }
    });

    function renderView2(data) {
        document.getElementById('text-original').textContent = data.original;
        document.getElementById('text-corrected').textContent = data.corrected;
        
        const altContainer = document.getElementById('alternatives-container');
        altContainer.innerHTML = '';

        if (data.alternatives) {
            data.alternatives.forEach((alt, idx) => {
                const box = document.createElement('div');
                box.style = 'margin-bottom:25px; padding:20px; background:#f9f9f9; border:1px solid #e0e0e0; border-radius:12px;';
                box.innerHTML = `<h4 style="margin-bottom:15px; color:#2c3e50;">💡 '${alt.part}' 영역 추천 표현</h4>`;
                
                const categories = [
                    { key: 'simple', label: '🟢 쉬운 표현 (Simple)' },
                    { key: 'standard', label: '🔵 평범한 표현 (Standard)' },
                    { key: 'creative', label: '🔥 독창적인 표현 (Creative)' }
                ];

                categories.forEach(cat => {
                    const optText = alt[cat.key];
                    if (optText) {
                        const label = document.createElement('label');
                        label.style = 'display:block; margin-bottom:10px; cursor:pointer; font-size:1.05rem;';
                        label.innerHTML = `
                            <input type="radio" name="alt_${idx}" value="${optText}" data-target="${alt.part}" ${cat.key === 'simple' ? 'checked' : ''}> 
                            <strong>${cat.label}:</strong> ${optText}
                        `;
                        box.appendChild(label);
                    }
                });
                altContainer.appendChild(box);
            });
        }

        window.tempOriginal = data.original;
        window.tempCorrected = data.corrected;
        switchView(1, 2);
    }

    document.getElementById('btn-start-practice').addEventListener('click', () => {
        practicePhrases = [];
        let tempSentence = window.tempOriginal;

        const radios = document.querySelectorAll('input[type="radio"]:checked');
        radios.forEach(radio => {
            const target = radio.getAttribute('data-target').trim();
            const val = radio.value.trim();
            if (tempSentence.includes(target)) {
                tempSentence = tempSentence.replace(target, val);
                practicePhrases.push(val);
            } else if (window.tempCorrected.includes(target)) {
                tempSentence = window.tempCorrected.replace(target, val);
                practicePhrases.push(val);
            } else {
                practicePhrases.push(val);
            }
        });

        finalSentence = tempSentence;
        if (practicePhrases.length === 0) {
            finalSentence = window.tempCorrected;
            practicePhrases.push(finalSentence);
        }

        questionBanner.classList.remove('hidden');
        currentPhraseIndex = 0;
        startPhase3();
    });

    // --- View 3: 보고 따라쓰기 ---
    function startPhase3() {
        currentRep = 1;
        switchView(2, 3);
        switchView(4, 3);
        updatePhase3UI();
    }

    function updatePhase3UI() {
        const targetPhrase = practicePhrases[currentPhraseIndex];
        qlueMessage.textContent = "상단의 하이라이트 된 텍스트를 보고 아래 칸에 똑같이 타이핑하세요!";
        document.getElementById('v3-progress').textContent = `Progress: ${currentRep} / ${REPETITIONS}회`;
        
        const parts = finalSentence.split(targetPhrase);
        const prefix = parts[0] || "";
        const suffix = parts.slice(1).join(targetPhrase) || "";

        document.getElementById('v3-guide-display').innerHTML = 
            `${prefix}<span class="target-highlight">${targetPhrase}</span>${suffix}`;

        document.getElementById('v3-prefix').textContent = prefix;
        document.getElementById('v3-suffix').textContent = suffix;
        
        const input = document.getElementById('v3-input');
        input.value = "";
        input.style.width = Math.max(targetPhrase.length * 13, 110) + "px";
        input.focus();

        input.oninput = (e) => {
            const typed = e.target.value;
            const correctLen = getCorrectPrefixLength(targetPhrase, typed);

            if (correctLen !== typed.length) {
                input.value = typed.slice(0, -1);
                input.classList.add('error');
                setTimeout(() => input.classList.remove('error'), 300);
            } else {
                input.value = targetPhrase.substring(0, typed.length);
                if (input.value === targetPhrase) {
                    input.oninput = null;
                    setTimeout(() => {
                        currentRep++;
                        if (currentRep > REPETITIONS) startPhase4();
                        else updatePhase3UI();
                    }, 400);
                }
            }
        };
    }

    // --- View 4: 단어 행맨 (안 보고 빈칸 채우기) ---
    function startPhase4() {
        currentRep = 1;
        switchView(3, 4);
        updatePhase4UI();
    }

    function updatePhase4UI() {
        const targetPhrase = practicePhrases[currentPhraseIndex];
        qlueMessage.textContent = "이번엔 안 보고 채워 넣을 차례입니다. 기억을 더듬어 빈칸을 완성하세요!";
        document.getElementById('v4-progress').textContent = `Progress: ${currentRep} / ${REPETITIONS}회`;
        
        const parts = finalSentence.split(targetPhrase);
        const prefix = parts[0] || "";
        const suffix = parts.slice(1).join(targetPhrase) || "";
        const blanks = targetPhrase.replace(/[a-zA-Z0-9]/g, "_");

        document.getElementById('v4-guide-display').innerHTML = 
            `${prefix}<span class="target-highlight">${blanks}</span>${suffix}`;

        document.getElementById('v4-prefix').textContent = prefix;
        document.getElementById('v4-suffix').textContent = suffix;
        
        const input = document.getElementById('v4-input');
        input.value = "";
        input.style.width = Math.max(targetPhrase.length * 13, 110) + "px";
        input.focus();

        document.getElementById('btn-check-word').onclick = () => {
            const typed = input.value.trim();
            const correctLen = getCorrectPrefixLength(targetPhrase, typed);

            if (correctLen === targetPhrase.length && typed.length === targetPhrase.length) {
                currentRep++;
                if (currentRep > REPETITIONS) {
                    currentPhraseIndex++;
                    if (currentPhraseIndex < practicePhrases.length) startPhase3();
                    else startPhase5();
                } else {
                    updatePhase4UI();
                }
            } else {
                const correctPart = targetPhrase.substring(0, correctLen);
                input.value = correctPart; 
                input.classList.add('error');
                setTimeout(() => input.classList.remove('error'), 300);

                const nextChar = targetPhrase.charAt(correctLen);
                if (correctLen > 0) {
                    qlueMessage.innerHTML = `💦 <b>힌트:</b> "${correctPart}" 까지 맞았습니다! 그 다음 글자는 <b>'${nextChar}'</b> 입니다.`;
                } else {
                    qlueMessage.innerHTML = `💦 <b>힌트:</b> 첫 글자는 <b>'${nextChar}'</b> 로 시작합니다!`;
                }
            }
        };
    }

    // --- View 5: 전체 문장 행맨 ---
    function startPhase5() {
        switchView(4, 5);
        qlueMessage.textContent = "최종 관문! 문장 전체를 한번에 채워보세요.";
        
        let currentCorrectLen = 0;
        const display = document.getElementById('v5-full-sentence');
        display.innerHTML = generateSentenceBlanks(finalSentence, currentCorrectLen);
        
        const input = document.getElementById('v5-input');
        input.value = "";
        input.focus();

        document.getElementById('btn-check-sentence').onclick = () => {
            const typed = input.value.trim();
            const cleanFinal = finalSentence.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
            const cleanTyped = typed.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
            
            currentCorrectLen = getCorrectPrefixLength(finalSentence, typed);
            display.innerHTML = generateSentenceBlanks(finalSentence, currentCorrectLen);

            if (cleanTyped === cleanFinal) {
                startPhase6();
            } else {
                const correctPart = finalSentence.substring(0, currentCorrectLen);
                input.value = correctPart;
                input.classList.add('error');
                setTimeout(() => input.classList.remove('error'), 300);

                const nextChar = finalSentence.charAt(currentCorrectLen);
                if (currentCorrectLen > 0) {
                    qlueMessage.innerHTML = `💡 <b>힌트:</b> "${correctPart}" 다음 글자는 <b>'${nextChar}'</b> 입니다.`;
                } else {
                    qlueMessage.innerHTML = `💡 <b>힌트:</b> 문장의 첫 글자는 <b>'${nextChar}'</b> 입니다.`;
                }
            }
        };
    }

    // --- View 6: 완료 및 유기적 후속 라우팅 ---
    function startPhase6() {
        switchView(5, 6);
        questionBanner.classList.add('hidden');
        qlueMessage.textContent = "Fantastic! 완벽하게 문장을 마스터하셨습니다. 🎉";
        document.getElementById('summary-final-sentence').textContent = finalSentence;
    }

    document.getElementById('btn-next-question').addEventListener('click', async () => {
        questionRound++;

        if (questionRound <= 3) {
            document.getElementById('btn-next-question').disabled = true;
            qlueMessage.textContent = "Great. Creating the next follow-up question for you... 🧠";

            try {
                const response = await fetch('http://localhost:3000/api/next-question', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        previousAnswer: finalSentence,
                        interests: userInterests
                    })
                });
                const data = await response.json();
                
                currentQuestion = data.question;

                // 세션 초기화 및 다음 라운드 리셋
                currentPhraseIndex = 0;
                document.getElementById('user-answer').value = "";
                document.getElementById('header-progress').textContent = `Q ${questionRound}/3`;
                document.getElementById('banner-question-text').textContent = currentQuestion;
                qlueMessage.textContent = `Question ${questionRound}: "${currentQuestion}"`;

                switchView(6, 1);

            } catch (error) {
                alert("후속 질문을 가져오지 못했습니다.");
            } finally {
                document.getElementById('btn-next-question').disabled = false;
            }
        } else {
            qlueMessage.textContent = "Congratulations! You have completed the entire interview session. 🏆";
            alert("총 3개의 인터뷰 질문을 모두 마스터하셨습니다! 세션이 종료됩니다.");
            location.reload(); 
        }
    });

    function switchView(from, to) {
        views[from].classList.remove('active');
        views[from].classList.add('hidden');
        views[to].classList.remove('hidden');
        views[to].classList.add('active');
    }
});