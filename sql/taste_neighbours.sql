SELECT user_id
FROM user_taste_vectors
ORDER BY taste <-> $1
LIMIT 200;
