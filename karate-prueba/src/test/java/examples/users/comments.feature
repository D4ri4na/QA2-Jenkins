Feature: API de Comments (Anidados por Post)

  Background:
    * url baseUrl

  Scenario: Agregar un comentario a un post (POST Anidado)
    * def postFeature = call read('posts.feature@CreatePost')
    * def postId = postFeature.postId

    Given path 'posts', postId, 'comments'
    And request { "name": "Bassanti", "email": "basanti@gmail.com", "body": "Probando el endpoint de comentarios" }
    When method post
    Then status 201
    And match response.post_id == postId
    And match response.name == "Bassanti"

  Scenario: Obtener los comentarios de un post (GET Anidado)
    * def postFeature = call read('posts.feature@CreatePost')
    * def postId = postFeature.postId

    Given path 'posts', postId, 'comments'
    And request { "name": "Lector", "email": "lector@gmail.com", "body": "Excelente post" }
    When method post
    Then status 201

    Given path 'posts', postId, 'comments'
    When method get
    Then status 200
    And match response == '#array'
    And match response[0].post_id == postId
