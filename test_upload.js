async function run() {
  try {
    const URL = 'https://tg-web-app-black.onrender.com/api';
    
    console.log("1. Creating user...");
    const authRes = await fetch(`${URL}/auth/telegram`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        telegramId: '999999999',
        firstName: 'Test',
        lastName: 'User'
      })
    });
    
    const userData = await authRes.json();
    const userId = userData.id;
    console.log("User ID:", userId);
    
    console.log("2. Uploading photo...");
    const photosRes = await fetch(`${URL}/users/${userId}/photos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        photos: [
          { url: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAAAAAAAD/2wBD...', isAvatar: true, order: 0 }
        ]
      })
    });
    
    const photosData = await photosRes.json();
    if (!photosRes.ok) throw new Error(photosData.error);
    console.log("Success:", photosData);
    
  } catch (err) {
    console.error("Error:", err.message);
  }
}

run();
