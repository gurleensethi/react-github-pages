const core = require("@actions/core");
const github = require("@actions/github");
const exec = require("@actions/exec");
const { spawnSync } = require("child_process");
const path = require("path");

(async () => {
  try {
    let email = core.getInput("email");
    let name = core.getInput("name");
    const accessToken = core.getInput("access_token");
    const projectFolder = core.getInput("project_folder");
    const repositoryName = github.context.payload.repository.full_name;

    if (!email) {
      const { repository } = github.context.payload;
      if (repository && repository.owner) {
        email = repository.owner.email;
        name = repository.owner.name;
      }
    }

    // 'cd' change directory was not working for some reason.
    const npmChangeDir = !!projectFolder ? `--prefix ${projectFolder}` : "";
    const gitChangeDir = `-C ${path.join(projectFolder || "", "build")}`;

    await exec.exec(`npm install ${npmChangeDir}`);
    await exec.exec(`npm run build --production ${npmChangeDir}`);
    await exec.exec(`git ${gitChangeDir} init`);
    await exec.exec(`git ${gitChangeDir} config --global user.email ${email}`);
    await exec.exec(`git ${gitChangeDir} config --global user.name ${name}`);
    await exec.exec(
      `git ${gitChangeDir} remote add origin https://${accessToken}@github.com/${repositoryName}.git`
    );
    await exec.exec(`git ${gitChangeDir} checkout -b gh-pages`);
    await exec.exec(`git ${gitChangeDir} add .`);
    await exec.exec(`git ${gitChangeDir} commit -m "Deployment of web app."`);
    await exec.exec(`git ${gitChangeDir} push origin gh-pages -f`);
  } catch (error) {
    core.setFailed(error.message);
  }
})();
