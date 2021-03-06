import { Result, Ok, Err } from "@usefultools/monads";
import { Session } from "../session/session";
import { spawnSync } from "child_process";
import chalk from "chalk";

export interface IDownloader {
    Download(url: string, file: string, resume: boolean): Result<number, Error>;
    startDownload(url: string, file: string, resume: boolean): Result<number, Error>;
    createCommand(url: string, file: string): string[];
    enableResume(command: string[]): string[];
    addCookies(command: string[], cookies: string): string[];
}

export abstract class ExternalDownloader implements IDownloader {
    session: Session;
    binary: string;

    constructor(session: Session) {
        this.session = session;
    }

    Download(url: string, file: string, resume: boolean): Result<number, Error> {
        return this.startDownload(url, file, resume);
    }

    startDownload(url: string, file: string, resume: boolean): Result<number, Error> {
        let command = this.createCommand(url, file);
        command = this.prepareCookies(command);
        if (resume) {
            command = this.enableResume(command);
        }
        let maxlen = Math.min(80, url.length);
        try {
            console.log(chalk.cyan(`\t\t> Downloading [${url.slice(0, maxlen)}...] => [${file}]`));
            spawnSync(this.binary, command, { stdio: "inherit" });
            return Ok(0);
        } catch (e) {
            return Err(Error(url));
        }
    }

    abstract createCommand(url: string, file: string): string[];
    abstract enableResume(command: string[]): string[];
    abstract addCookies(command: string[], cookies: string): string[];

    prepareCookies(command: string[]): string[] {
        let cookies = this.session.CookieHeader();
        if (cookies.length > 0) {
            command = this.addCookies(command, cookies);
        }
        return command;
    }
}
