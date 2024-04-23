// Função para verificar se o usuário já votou nesta mensagem
function hasUserVoted(messageId) {
    var votedMessages = JSON.parse(localStorage.getItem('votedMessages')) || [];
    return votedMessages.includes(messageId.toString());
}

// Função para armazenar o ID da mensagem em que o usuário votou
function recordVote(messageId) {
    var votedMessages = JSON.parse(localStorage.getItem('votedMessages')) || [];
    votedMessages.push(messageId.toString());
    localStorage.setItem('votedMessages', JSON.stringify(votedMessages));
}

// Função para remover o like de uma mensagem
function removeLike(messageId) {
    // Verifica se o usuário já votou nesta mensagem
    if (hasUserVoted(messageId)) {
        // Decrementa o contador de likes localmente
        var likeCountElement = document.querySelector('.message[data-id="' + messageId + '"] .like-count');
        var currentLikes = parseInt(likeCountElement.textContent);
        likeCountElement.textContent = Math.max(currentLikes - 1, 0);

        // Remove o ID da mensagem da lista de mensagens curtidas
        var votedMessages = JSON.parse(localStorage.getItem('votedMessages')) || [];
        var index = votedMessages.indexOf(messageId.toString());
        if (index !== -1) {
            votedMessages.splice(index, 1);
            localStorage.setItem('votedMessages', JSON.stringify(votedMessages));
        }
    } else {
        console.log('Você ainda não curtiu esta mensagem.');
    }
}

// Função para lidar com o clique no botão de "like"
function handleLikeClick(messageId) {
    // Verifica se o usuário já votou nesta mensagem
    if (!hasUserVoted(messageId)) {
        // Aqui você pode implementar a lógica para enviar uma requisição ao servidor informando que o usuário curtiu a mensagem
        console.log('O usuário curtiu a mensagem com o ID:', messageId);

        // Atualiza o contador de likes localmente
        var likeCountElement = document.querySelector('.message[data-id="' + messageId + '"] .like-count');
        var currentLikes = parseInt(likeCountElement.textContent);
        likeCountElement.textContent = currentLikes + 1;

        // Atualiza o estado do usuário para indicar que ele votou nesta mensagem
        recordVote(messageId);
    } else {
        // Se o usuário já votou, remove o like
        removeLike(messageId);
    }
}

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
                messageDiv.dataset.id = message.id; // Definir o atributo data-id com o id da mensagem
                messageDiv.innerHTML = `
                    <h3>${message.title}</h3>
                    <p id="priority" class="priority-text" style="color: ${getColorByPriority(message.priority)};">Situação: ${message.priority}</p>
                    <p>${message.content}</p>
                    <p>Atualizado às: ${message.datetime}</p>
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
                    <p>Atualizado às: ${message.datetime}</p>
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
