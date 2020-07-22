- https://dev.twitch.tv/docs/api/webhooks-reference#subscribe-tounsubscribe-from-events
- https://dev.twitch.tv/docs/api/webhooks-guide


## Subscribe and unsubscribe

**[POST]** => https://api.twitch.tv/helix/webhooks/hub

**JSON Data**
```
{
    "hub.callback": "http://460ec3f71132.ngrok.io/webhook",
    "hub.mode": "subscribe",
    "hub.topic": "https://api.twitch.tv/helix/streams?user_id=198215664",
    "hub.lease_seconds": 432000
}
```

**Headers**

- Authorization: Bearer [XXX]
- Client-ID: [XXX]

## Examples

```python
{'data': [{'game_id': '509670',
           'id': '51311442',
           'language': 'it',
           'started_at': '2020-07-15T15:58:09Z',
           'tag_ids': None,
           'thumbnail_url': 'https://static-cdn.jtvnw.net/previews-ttv/live_user_tkdalex-{width}x{height}.jpg',
           'title': 'Coding time - chill',
           'type': 'live',
           'user_id': '198215664',
           'user_name': 'TkdAlex',
           'viewer_count': 1}]}
127.0.0.1 - - [15/Jul/2020 18:00:22] "POST /webhook HTTP/1.1" 200 -
```

```python
{'data': [{'game_id': '509670',
           'id': '51311442',
           'language': 'it',
           'started_at': '2020-07-15T15:58:09Z',
           'tag_ids': ['5b9935eb-1e9a-4217-98ad-62bda5cff0d1'],
           'thumbnail_url': 'https://static-cdn.jtvnw.net/previews-ttv/live_user_tkdalex-{width}x{height}.jpg',
           'title': 'Coding time - Test webhoooooks',
           'type': 'live',
           'user_id': '198215664',
           'user_name': 'TkdAlex',
           'viewer_count': 1}]}
127.0.0.1 - - [15/Jul/2020 18:02:49] "POST /webhook HTTP/1.1" 200 -
```

```python
{'data': []}
127.0.0.1 - - [15/Jul/2020 18:04:01] "POST /webhook HTTP/1.1" 200 -
```