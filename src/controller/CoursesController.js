import * as browserSession from "./PuppeteerController.js"
import fs from "fs"

const coursesUrl = "https://vueschool.io/courses"
async function getAuthh(socket, data, req) {
    try {
        let getAuth = fs.readFileSync("./cookies.txt");
        const cookies = JSON.parse(getAuth);
        socket.send("cookies found!");
        return cookies
    } catch (error) {
        socket.send(error.message)
    }
}

export async function GetCourses(socket, data, req) {
    try {
        const cookies = await getAuthh(socket, data, req)
        const page = await browserSession.createPage()
        await page.goto(coursesUrl, { waitUntil: "networkidle2" });
        socket.send("set cookies on page")
        await page.setCookie(...cookies)
        socket.send("trying to scrap all courses")
        const getEachCourse = await page.$$eval("a.thumb-card", (el) => {
            return el.map((e, i) => {
                const title = e.querySelector("h3.text-xl").innerText;
                const url = e.getAttribute("href");
                const regex = /\(\"(.*?)\"\)/;
                const findThumbnail = e
                    .querySelector("div.thumbnail")
                    .getAttribute("style")
                    .match(regex);
                const thumbnail = findThumbnail ? findThumbnail[1] : "";
                return { id: i, title, url, thumbnail, checked: false };
            });
        });
        socket.send(JSON.stringify(getEachCourse))
        socket.terminate()
    } catch (error) {
        socket.send(JSON.stringify({ type: "getCourses", msg: error.message }))
    }

}

export async function GetSelectedLesson(socket, data, req) {
    try {
        const selectedCourses = data.selected;
        for (let i = 0; i < selectedCourses.length; i++) {
            const page = await browserSession.createPage()
            socket.send(JSON.stringify({ type: "getCourses", status: "waiting for:", log: selectedCourses[i].url }));
            await page.goto(selectedCourses[i].url, { waitUntil: "networkidle2" });
            socket.send(JSON.stringify({ type: "getCourses", status: "get lesson each url from: ", log: selectedCourses[i].url }));
            const lessonUrl = await page.$$eval("a.title", (el) =>
                el.map((e, i) => {
                    return e.getAttribute("href");
                })
            );
            Object.assign(selectedCourses[i], { urls: lessonUrl.slice() });
        }
        socket.send(JSON.stringify(selectedCourses));
        socket.terminate()
    } catch (error) {
        console.log(error)
        socket.send(JSON.stringify({ type: "getSelectedLesson", error: error.message }))
        if (error.message.includes('timeout')) {
            GetSelectedLesson(socket, data, req)
        }
    }
}

export async function GetVideoLesson(socket, data, req) {
    try {
        const lessons = data.videoLessons
        const videoLesson = [];
        for (let i = 0; i < lessons.length; i++) {
            const videoUrls = [];
            for (let j = 0; j < lessons[i].urls.length; j++) {
                const page = await browserSession.createPage();
                socket.send(`waiting for scraping video from: ${lessons[i].urls[j]}`);
                await page.goto(lessons[i].urls[j], { waitUntil: "networkidle2" });
                socket.send(`get url video from: ${lessons[i].urls[j]}`);
                const video = await page.$eval("iframe", (e) => e.getAttribute("src"));
                videoUrls.push(video);
            }
            const newLesson = { ...lessons[i] };
            newLesson.videoUrls = videoUrls;
            videoLesson.push(newLesson);
            socket.send(JSON.stringify({ type: "getEachVideo", videosUrls: newLesson }))
        }
        socket.terminate()
    } catch (error) {
        console.log(error.message)
        socket.send(JSON.stringify({ type: "getEachVideo", error: error.message }))
        if (error.message.includes('timeout')) {
            GetSelectedLesson(socket, data, req)
        }
    }
}