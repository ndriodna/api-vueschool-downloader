### websocket send type and msg

#### login browser

> {"type": "login"}

#### get all courses

> {"type":"getCourses", "data": cookies}

#### get selected courses

> {
> "type":"getSelectedLesson",
> "selected": [{id,title, url, thumbnail, checked: false}]
> }

#### get each video lesson

> {
> "type":"getEachVideo",
> "data":[{id, title, url, thumbnail, checked: true, urls: []}]
> }

#### createPath && downloader

> {
> "type":"downloader", / type:"createPath"
> "data":[{id, title, thumbnail, checked: true, urls: [], videosulrs: []}]
> }
