from flask import Flask, render_template, request, redirect, url_for, flash, jsonify
import sqlite3
import datetime

app = Flask(__name__)
app.secret_key = 'sua_chave_secreta'

# Configuração do banco de dados
DB_NAME = 'messages.db'

def create_tables():
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute('''CREATE TABLE IF NOT EXISTS messages (
                  id INTEGER PRIMARY KEY AUTOINCREMENT,
                  title TEXT NOT NULL,
                  content TEXT NOT NULL,
                  priority TEXT NOT NULL,
                  datetime TEXT NOT NULL)''')
    
    cursor.execute('''CREATE TABLE IF NOT EXISTS message_history (
                  id INTEGER PRIMARY KEY AUTOINCREMENT,
                  message_id INTEGER NOT NULL,
                  action TEXT NOT NULL,
                  datetime TEXT NOT NULL,
                  FOREIGN KEY(message_id) REFERENCES messages(id))''')
    

    conn.commit()
    conn.close()

# Função para inserir uma mensagem no banco de dados
def insert_message(title, content, priority):
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    datetime_now = datetime.datetime.now().strftime("%d-%m-%Y %H:%M:%S")
    cursor.execute("INSERT INTO messages (title, content, priority, datetime) VALUES (?, ?, ?, ?)", (title, content, priority, datetime_now))
    conn.commit()
    conn.close()


# Função para obter todas as mensagens do banco de dados
def get_messages():
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM messages")
    messages = cursor.fetchall()
    conn.close()
    return messages

# Função para obter as mensagens resolvidas do banco de dados
def get_resolved_messages():
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM messages WHERE priority='resolvido'")
    resolved_messages = cursor.fetchall()
    conn.close()
    return resolved_messages

# Função para editar uma mensagem no banco de dados
def update_message(message_id, new_title, new_content, new_priority):
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    datetime_now = datetime.datetime.now().strftime("%d-%m-%Y %H:%M:%S")
    cursor.execute("UPDATE messages SET title=?, content=?, priority=?, datetime=? WHERE id=?", (new_title, new_content, new_priority, datetime_now, message_id))
    conn.commit()
    conn.close()

# Função para excluir uma mensagem do banco de dados
def delete_message(message_id):
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM messages WHERE id=?", (message_id,))
    message = cursor.fetchone()
    if message:
        # Registra a exclusão no histórico antes de excluir a mensagem
        datetime_now = datetime.datetime.now().strftime("%d-%m-%Y %H:%M:%S")
        cursor.execute("INSERT INTO message_history (message_id, action, datetime) VALUES (?, ?, ?)", (message_id, 'exclusão', datetime_now))
        conn.commit()
        cursor.execute("DELETE FROM messages WHERE id=?", (message_id,))
        conn.commit()
    conn.close()

# Função para obter o histórico de uma mensagem do banco de dados
def get_message_history(message_id):
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM message_history WHERE message_id=?", (message_id,))
    history = cursor.fetchall()
    conn.close()
    return history

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/admin', methods=['GET', 'POST'])
def admin():
    if request.method == 'POST':
        title = request.form['title']
        content = request.form['content']
        priority = request.form['priority']  # Novo campo de prioridade
        insert_message(title, content, priority)
        flash('Mensagem enviada com sucesso', 'success')
        return redirect(url_for('admin'))

    messages = get_messages()
    resolved_messages = get_resolved_messages() # Obter as mensagens resolvidas
    return render_template('admin.html', messages=messages, resolved_messages=resolved_messages)

@app.route('/messages')
def view_messages():
    messages = get_messages()
    return render_template('messages.html', messages=messages)

@app.route('/get_messages')
def get_messages_json():
    messages = get_messages()
    formatted_messages = [{'id': msg[0], 'title': msg[1], 'content': msg[2], 'priority': msg[3], 'datetime': msg[4]} for msg in messages]
    return jsonify(formatted_messages)

@app.route('/get_resolved_messages')
def get_resolved_messages_json():
    resolved_messages = get_resolved_messages()
    formatted_resolved_messages = [{'id': msg[0], 'title': msg[1], 'content': msg[2], 'priority': msg[3], 'datetime': msg[4]} for msg in resolved_messages]
    return jsonify(formatted_resolved_messages)

@app.route('/edit_message/<int:message_id>', methods=['GET', 'POST'])
def edit_message_route(message_id):
    if request.method == 'POST':
        new_title = request.form['title']
        new_content = request.form['content']
        new_priority = request.form['priority']  # Novo campo de prioridade
        update_message(message_id, new_title, new_content, new_priority)
        flash('Mensagem editada com sucesso', 'success')
        return redirect(url_for('admin'))

    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM messages WHERE id=?", (message_id,))
    message = cursor.fetchone()
    conn.close()

    return render_template('edit_message.html', message=message)

@app.route('/delete_message/<int:message_id>')
def delete_message_route(message_id):
    delete_message(message_id)
    flash('Mensagem apagada com sucesso', 'success')
    return redirect(url_for('admin'))

@app.route('/message_history/<int:message_id>')
def message_history(message_id):
    history = get_message_history(message_id)
    return render_template('message_history.html', history=history)

# Redirecionamento de admin.html para index.html
@app.route('/admin.html')
def redirect_to_index():
    return redirect(url_for('index'))

@app.route('/message_history')
def view_message_history():
    # Obter todas as mensagens do banco de dados
    messages = get_messages()
    return render_template('message_history.html', messages=messages)

if __name__ == '__main__':
    create_tables()
    app.run(debug=True, host='0.0.0.0')
