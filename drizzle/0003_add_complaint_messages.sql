CREATE TABLE complaint_messages (
  message_id SERIAL PRIMARY KEY,
  complaint_id INTEGER REFERENCES complaints(complaint_id) ON DELETE CASCADE,
  sender_id INTEGER REFERENCES users(user_id),
  sender_role VARCHAR(20),
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
); 