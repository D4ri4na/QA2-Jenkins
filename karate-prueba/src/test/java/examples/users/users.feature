Feature: Crud para crear Usuario

    Background:
    * url baseUrl
    * def dataGenerator = Java.type('Utils.DataGenerator')
    * def randomEmail = 'user_' + java.util.UUID.randomUUID() + '@gmail.com'

    * def payload =
    """
    {
      "name": "Tenali Ramakrishna",
      "gender": "male",
      "email": "#(randomEmail)",
      "status": "active"
    }
    """
    @Smock @CreateUser
    Scenario: Crear un nuevo usuario
      * def randomString = java.util.UUID.randomUUID().toString()
      * def randomEmail = 'user_' + randomString + '@gmail.com'

      Given path 'users'
      And request { "name": "Dpa", "email": "#(randomEmail)", "gender": "female", "status": "active" }
      When method post
      Then status 201
      * def userId = response.id
      * print 'ID de Usuario guardado: ', userId

  Scenario: Crear un nuevo usuario exitosamente
    Given path 'users'
    And request payload
    When method post
    Then status 201
    And match response ==
    """
    {
      "id": '#number',
      "name": "Tenali Ramakrishna",
      "email": "#(randomEmail)",
      "gender": "male",
      "status": "active"
    }
    """

  Scenario: Crear Usuario Nuevo usando FakeData
    * def emailFake = dataGenerator.getEmailRandom()
    * def nameFake = dataGenerator.getRandomUsername()
    Given path 'users'
    And request {"name":#(nameFake), "gender":"male", "email":#(emailFake), "status":"active"}
    When method Post
    Then status 201
    And match response ==
    """
    {
      "id": "#number",
      "name": "#string",
      "email": "#string",
      "gender": "#string",
      "status": "#string"
    }
    """

  Scenario: Obtener Datos de un Usuario (GET)
    Given path 'users'
    And request payload
    When method Post
    Then status 201
    * def userid = response.id
    * print userid

    Given path 'users', userid
    When method Get
    Then status 200
    And match response ==
    """
    {
      "id": '#(userid)',
      "name": "Tenali Ramakrishna",
      "email": "#(randomEmail)",
      "gender": "male",
      "status": "active"
    }
    """

  Scenario: Actualizar parcialmente un Usuario (PATCH)
    Given path 'users'
    And request payload
    When method Post
    Then status 201
    * def userid = response.id

    Given path 'users', userid
    And request { "status": "inactive" }
    When method Patch
    Then status 200
    And match response.status == 'inactive'
    And match response.id == userid

  Scenario: Reemplazar un Usuario completo (PUT)
    Given path 'users'
    And request payload
    When method Post
    Then status 201
    * def userid = response.id

    * def updatedEmail = 'updated_' + java.util.UUID.randomUUID() + '@gmail.com'
    Given path 'users', userid
    And request
    """
    {
      "name": "Nombre Actualizado",
      "gender": "female",
      "email": "#(updatedEmail)",
      "status": "inactive"
    }
    """
    When method Put
    Then status 200
    And match response.name == "Nombre Actualizado"
    And match response.email == updatedEmail

  Scenario: Eliminar un Usuario (DELETE)
    Given path 'users'
    And request payload
    When method Post
    Then status 201
    * def userid = response.id

    Given path 'users', userid
    When method Delete
    Then status 204

    Given path 'users', userid
    When method Get
    Then status 404
