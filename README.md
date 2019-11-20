# mouro
uPort Trust Graph Server (aka EdgeServer)

[![CircleCI](https://circleci.com/gh/uport-project/mouro.svg?style=svg&circle-token=26fa9a6aff710aa959b22ffa15f7ef314face8b0)](https://circleci.com/gh/uport-project/mouro)
[![codecov](https://codecov.io/gh/uport-project/mouro/branch/master/graph/badge.svg?token=ywlwzVP2fF)](https://codecov.io/gh/uport-project/mouro)

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy)


_In Spain mythology, the Mouros are a race of supernatural beings which were forced to take refuge under the earth. The Mouros work with gold, silver and gem stones with which they make up enormous treasures that are protected by cuélebres._

![Mouros](./mouros.jpg)

## Description

This lambda functions stores user data and information. 

If you want to run your own instance, please see [RUN_INSTANCE.md](./RUN_INSTANCE.md)

## API Description

### GraphQL

The GraphQL allows to query data from the service.

[GraphQL Schema](./src/lib/schema.graphql)


#### Endpoint

`POST /graphql`

#### Headers

| Header         | Description    | Example                                           |
|:---------------|----------------|---------------------------------------------------|
| Authorization  | DID-Auth Token | `Authorization Bearer eyJhbGciOiJIUzI1NiIsInR...` |

The authorization token is a DID-JWT signed by the caller. The payload of the JWT is:

```
{
    iss: <did of the caller>,
    sub: <did of the caller>,
    aud: <did of the server>, // did:web:edge.uport.me
    claim: {
        access:[
            eyJhbGciOiJIUzI1NiIsInR...., //Access tokens
            eyJhbGciOiJIUzI1NiIsInR....,
        ]
    },
    iat: <timestamp in sec>,
    exp: <short expiration>
}
```


The access tokens are JWT's signed by the owner of the edge. The owner of each edge is defined by the did of the "to" field. The payload of the access token is:

```
{
    iss: <did of the owner of the edge>,
    sub: <did of the access grantee>,
    claim: {
        action: "read"
        condition: {
            from: <did of the access grantee> 
        }
    },
    iat: <timestamp in sec>,
    exp: <expiration timestamp in sec>,
    nbf: <not before timestamp in sec>
}
```

in this example, the grantee is given access to all the edges owned by the issuer to the access token  in which the "from" field of the edge is the grantee (the edges issued by him).

If no access tokens are present in the authorization token, the caller only have access to his own edges (where his did is in the "to" field of the edge)




