const { db } = require('./database');

const seedDB = () => {
  const universities = [
    { name: 'MIT', domain: 'mit.edu' },
    { name: 'Stanford', domain: 'stanford.edu' },
    { name: 'UC Berkeley', domain: 'berkeley.edu' },
    { name: 'Harvard', domain: 'harvard.edu' }
  ];

  universities.forEach(uni => {
    db.run(
      'INSERT OR IGNORE INTO universities (name, domain) VALUES (?, ?)',
      [uni.name, uni.domain]
    );
  });

  const users = [
    { email: 'alice@mit.edu', name: 'Alice Chen', uni_name: 'MIT' },
    { email: 'bob@mit.edu', name: 'Bob Smith', uni_name: 'MIT' },
    { email: 'carol@stanford.edu', name: 'Carol Davis', uni_name: 'Stanford' },
    { email: 'david@berkeley.edu', name: 'David Lee', uni_name: 'UC Berkeley' },
    { email: 'eve@harvard.edu', name: 'Eve Wilson', uni_name: 'Harvard' }
  ];

  users.forEach(user => {
    db.run(
      `INSERT OR IGNORE INTO users (email, name, university_id)
       SELECT ?, ?, id FROM universities WHERE name = ?`,
      [user.email, user.name, user.uni_name]
    );
  });

  const services = [
    {
      email: 'alice@mit.edu',
      title: 'Need groceries from Whole Foods',
      description: 'Running low on food, need someone to grab essentials',
      source: 'Whole Foods, Cambridge',
      destination: 'MIT Dorm 5'
    },
    {
      email: 'bob@mit.edu',
      title: 'Willing to do meal prep runs',
      description: 'I have a car and free time on weekends',
      source: 'Campus',
      destination: 'Anywhere on campus'
    },
    {
      email: 'carol@stanford.edu',
      title: 'Need textbook pickup',
      description: 'Textbook is at bookstore, need it by tonight',
      source: 'Stanford Bookstore',
      destination: 'Cardinal Dorm'
    },
    {
      email: 'david@berkeley.edu',
      title: 'Room cleaning help wanted',
      description: 'Spring cleaning, could use an extra pair of hands',
      source: 'My dorm room',
      destination: 'N/A'
    }
  ];

  services.forEach(service => {
    db.run(
      `INSERT INTO services (user_id, title, description, source_location, destination_location, status)
       SELECT id, ?, ?, ?, ?, 'open' FROM users WHERE email = ?`,
      [service.title, service.description, service.source, service.destination, service.email]
    );
  });

  console.log('Database seeded with fixtures');
};

module.exports = { seedDB };
