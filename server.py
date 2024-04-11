from flask import Flask, render_template, request, redirect, url_for, flash, jsonify
import sqlite3
import datetime

app = Flask(__name__)
app.secret_key = 'sua_chave_secreta'

# Configuração do banco de dados
DB_NAME = 'messages.db'

def create_table():
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute('''CREATE TABLE IF NOT EXISTS messages (
                  id INTEGER PRIMARY KEY AUTOINCREMENT,
                  title TEXT NOT NULL,
                  content TEXT NOT NULL,
                  datetime TEXT NOT NULL)''')

    conn.commit()
    conn.close()

create_table()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/admin', methods=['GET', 'POST'])
def admin():
    if request.method == 'POST':
        title = request.form['title']
        content = request.form['content']
        
        conn = sqlite3.connect(DB_NAME)
        cursor = conn.cursor()
        datetime_now = datetime.datetime.now().strftime("%d-%m-%Y %H:%M:%S")
        cursor.execute("INSERT INTO messages (title, content, datetime) VALUES (?, ?, ?)", (title, content, datetime_now))
        conn.commit()
        conn.close()
        
        flash('Mensagem enviada com sucesso', 'success')
        return redirect(url_for('admin'))

    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM messages")
    messages = cursor.fetchall()
    conn.close()

    return render_template('admin.html', messages=messages)

@app.route('/messages')
def view_messages():
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM messages")
    messages = cursor.fetchall()
    conn.close()

    return render_template('messages.html', messages=messages)

@app.route('/get_messages')
def get_messages():
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM messages")
    messages = cursor.fetchall()
    conn.close()

    # Formatar mensagens como JSON
    formatted_messages = [{'id': msg[0], 'title': msg[1], 'content': msg[2], 'datetime': msg[3]} for msg in messages]
    return jsonify(formatted_messages)

@app.route('/edit_message/<int:message_id>', methods=['GET', 'POST'])
def edit_message(message_id):
    if request.method == 'POST':
        new_title = request.form['title']
        new_content = request.form['content']
        
        conn = sqlite3.connect(DB_NAME)
        cursor = conn.cursor()
        cursor.execute("UPDATE messages SET title=?, content=? WHERE id=?", (new_title, new_content, message_id))
        conn.commit()
        conn.close()
        
        flash('Mensagem editada com sucesso', 'success')
        return redirect(url_for('admin'))

    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM messages WHERE id=?", (message_id,))
    message = cursor.fetchone()
    conn.close()

    return render_template('edit_message.html', message=message)

@app.route('/delete_message/<int:message_id>')
def delete_message(message_id):
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute("DELETE FROM messages WHERE id=?", (message_id,))
    conn.commit()
    conn.close()

    flash('Mensagem apagada com sucesso', 'success')
    return redirect(url_for('admin'))

# Redirecionamento de admin.html para index.html
@app.route('/admin.html')
def redirect_to_index():
    return redirect(url_for('index'))

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0')
