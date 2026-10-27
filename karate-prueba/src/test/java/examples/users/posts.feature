Feature: API de Posts (Anidados por Usuario)

  Background:
    * url baseUrl

  @CreatePost
  Scenario: Crear un post para un usuario (POST Anidado)
    * def userFeature = call read('users.feature@CreateUser')
    * def userId = userFeature.userId

    Given path 'users', userId, 'posts'
    And request { "title": "LA Odisea", "body": "el primer fanfic" }
    When method post
    Then status 201
    * def postId = response.id
    And match response.user_id == userId


  Scenario: Listar posts creados por un usuario (GET Anidado)
    * def postHelper = call read('posts.feature@CreatePost')
    * def idUser = postHelper.userId

    Given path 'users', idUser, 'posts'
    When method get
    Then status 200
    And match response == '#array'
    And match response[0].user_id == idUser
