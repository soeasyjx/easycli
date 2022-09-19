#!/usr/bin/env node

/*
 * @Author: jiangxin
 * @Date: 2022-09-18 14:41:44
 * @Company: orientsec.com.cn
 * @Description:
 */

import chalk from "chalk";
import { Command } from "commander";
import fs from "fs";
import inquirer from "inquirer";
import path from "path";
import ora from "ora";
import download from "download-git-repo";
import updateNotifier from "update-notifier";

import packageJson from "./package.json" assert { type: "json" };

import { templates } from "./template.js";

const program = new Command();
// console.log('process.cwd()',process.cwd())
// console.log('fdsafsda',path.resolve('./package.json'))
// const textJson = fs.readFileSync(path.join(process.cwd(), 'package.json'), "utf8");
// const packageJson = JSON.parse(textJson);
// console.log(packageJson)

const notifier = updateNotifier({ pkg: packageJson });

if (notifier.update && notifier.update.latest !== packageJson.version) {
  notifier.notify({ defer: false, isGlobal: true });
}

const isObject = (val) => {
  return Object.prototype.toString.call(val) === "[object Object]";
};

console.log("packageJsonpackageJson", packageJson.name);

// 可通过 chiyou-cli --version 输出版本信息
// program.version(packageJson.version);

program
  .name(packageJson.name)
  .version(packageJson.version, "-v,--version")
//   .command(`${packageJson.name} [project-directory]`)
  .argument('[project-directory]')
  .alias("cy")
  .description("输入项目名称，初始化项目模板")
  .action(async (projectname, option, command) => {
    console.log("projectname", projectname);
    if (
      typeof projectname === "undefined" ||
      (isObject(projectname) && Object.keys(projectname).length === 0)
    ) {
      console.error("请输入业务文件夹名称:");
      console.log(
        `  ${chalk.cyan(packageJson.name)} ${chalk.green(
          "<project-directory>"
        )}`
      );
      console.error("示例:");
      console.log(
        `  ${chalk.cyan(packageJson.name)} ${chalk.green("slave-notice-app")}`
      );
      process.exit(1);
    }
    // 业务开发目录
    const dir = path.join(process.cwd(), projectname);
    // 检查命令运行目录下是否存在同名文件夹
    const checkDir = fs.existsSync(dir);
    if (checkDir) {
      console.log(
        `${chalk.red(
          `目录下已存在名为：${chalk.underline(projectname)} 的文件夹`
        )}`
      );
      process.exit(1);
    }

    const promptResult = await inquirer.prompt([
      {
        type: "list",
        name: "templatekey",
        message: "请选择您要拉取的开发模板",
        choices: Object.keys(templates)
      }
    ]);

    const getTemplateInfo = templates[promptResult.templatekey];
    if (!getTemplateInfo || !getTemplateInfo.url) {
      console.log(`${chalk.red("模板配置信息有误！")}`);
      process.exit(1);
    }

    const spinner = ora(
      `正在下载${chalk.bgGreen(promptResult.templatekey)}业务模板到项目中`
    ).start();

    // 开始下载项目
    download(getTemplateInfo.url, dir, { clone: true }, (error) => {
      if (error) {
        spinner.fail(`下载失败：${chalk.red(error)}`);
      } else {
        spinner.succeed("项目模板下载成功！");
        // 修改package.json内容
        const packageContent = fs.readFileSync(
          path.join(dir, "package.json"),
          "utf8"
        );
        const packageContentObject = JSON.parse(packageContent);
        packageContentObject.name = projectname;

        fs.writeFileSync(
          path.join(dir, "package.json"),
          JSON.stringify(packageContentObject, null, 2)
        );
      }
    });
    // console.log("selectTemplateKey", getTemplateInfo);
  });

program.parse();

