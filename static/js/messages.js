// Variável global para rastrear se o usuário já votou
var hasVoted = false;

// Função para lidar com o clique no botão de "like"
function handleLikeClick(messageId) {
    // Verifica se o usuário já votou
    if (!hasVoted) {
        // Aqui você pode implementar a lógica para enviar uma requisição ao servidor informando que o usuário curtiu a mensagem
        console.log('O usuário curtiu a mensagem com o ID:', messageId);

        // Atualiza o contador de likes
        var likeCountElement = document.querySelector('#messages-container [data-id="' + messageId + '"] .like-count');
        var currentLikes = parseInt(likeCountElement.textContent);
        likeCountElement.textContent = currentLikes + 1;

        // Define que o usuário já votou
        hasVoted = true;
    } else {
        // Se o usuário já votou, você pode exibir uma mensagem informando que só é permitido um voto
        console.log('Você já votou nesta mensagem.');
    }
}

// Variável para armazenar o conteúdo da última mensagem
var lastMessageContent = '';

// Função para fazer uma requisição AJAX para obter as mensagens
function fetchMessages() {
    fetch('/get_messages') // Rota no servidor para obter as mensagens
        .then(response => response.json())
        .then(messages => {
            const messagesContainer = document.getElementById('messages-container');
            messagesContainer.innerHTML = ''; // Limpa as mensagens existentes

            messages.forEach(message => {
                const messageDiv = document.createElement('div');
                messageDiv.classList.add('message');
                messageDiv.innerHTML = `
                            <h3>${message.title}</h3>
                            <p id="priority" class="priority-text" style="color: ${getColorByPriority(message.priority)};">Situação: ${message.priority}</p>
                            <p>${message.content}</p>
                            <p>Data e Hora: ${message.datetime}</p>
                            <div class="like-container">
                                <button class="like-button" onclick="handleLikeClick(${message.id})">👍</button>
                                <span class="like-count">0</span>
                            </div>
                        `;
                messagesContainer.appendChild(messageDiv);
            });

            if (messages.length > 0) {
                const latestMessage = messages[messages.length - 1];
                showNotificationWithUpdatedContent(latestMessage.content);
            }
        })
        .catch(error => {
            console.error('Erro ao obter as mensagens:', error);
            showNotificationWithUpdatedContent('Erro ao obter as mensagens.');
        });
}


// Atualiza as mensagens a cada 1 segundo (1000 milissegundos)
setInterval(fetchMessages, 1000);

// Função para exibir notificação com conteúdo atualizado
function showNotificationWithUpdatedContent(messageContent) {
    if (messageContent !== lastMessageContent) {
        if (Notification.permission !== 'granted') {
            Notification.requestPermission();
        } else {
            var notification = new Notification('Mensagens', {
                body: 'Conteúdo atualizado: ' + messageContent,
            });
            lastMessageContent = messageContent;
        }
    }
}

// Exibir notificação quando a página for carregada
window.onload = function () {
    if (Notification.permission !== 'granted') {
        Notification.requestPermission();
    } else {
        var notification = new Notification('Mensagens', {
            body: 'A tela foi atualizada.',
        });
    }
};

// Função para fazer uma requisição AJAX para obter as mensagens resolvidas
function fetchResolvedMessages() {
    fetch('/get_resolved_messages') // Rota no servidor para obter as mensagens resolvidas
        .then(response => response.json())
        .then(messages => {
            const resolvedMessagesContainer = document.getElementById('resolved-messages-container');
            resolvedMessagesContainer.innerHTML = ''; // Limpa as mensagens resolvidas existentes

            messages.forEach(message => {
                const messageDiv = document.createElement('div');
                messageDiv.classList.add('message');
                messageDiv.innerHTML = `
                            <h3>${message.title}</h3>
                            <p>${message.content}</p>
                            <p>Data e Hora: ${message.datetime}</p>
                            
                        `;
                resolvedMessagesContainer.appendChild(messageDiv);
            });
        })
        .catch(error => {
            console.error('Erro ao obter as mensagens resolvidas:', error);
        });
}

// Atualiza as mensagens resolvidas a cada 5 segundos (5000 milissegundos)
setInterval(fetchResolvedMessages, 5000);

// Chamar a função fetchResolvedMessages uma vez quando a página for carregada
fetchResolvedMessages();

// Função para retornar a cor com base na prioridade
function getColorByPriority(priority) {
    switch (priority) {
        case 'com problema':
            return '#ff6600'; // Vermelho
        case 'manutenção':
            return '#fffb00'; // Azul
        case 'resolvido':
            return '#00cc00'; // Verde
        default:
            return '#000'; // Cor padrão
    }
}
