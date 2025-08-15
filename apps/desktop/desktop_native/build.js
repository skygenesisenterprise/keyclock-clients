/* eslint-disable @typescript-eslint/no-var-requires */
const child_process = require("child_process");
const fs = require("fs");
const path = require("path");
const process = require("process");

// Map of the Node arch equivalents for the rust target triplets, used to move the file to the correct location
const rustTargetsMap = {
    "i686-pc-windows-msvc":       { nodeArch: 'ia32',  platform: 'win32'  },
    "x86_64-pc-windows-msvc":     { nodeArch: 'x64',   platform: 'win32'  },
    "aarch64-pc-windows-msvc":    { nodeArch: 'arm64', platform: 'win32'  },
    "x86_64-apple-darwin":        { nodeArch: 'x64',   platform: 'darwin' },
    "aarch64-apple-darwin":       { nodeArch: 'arm64', platform: 'darwin' },
    'x86_64-unknown-linux-musl':  { nodeArch: 'x64',   platform: 'linux'  },
    'aarch64-unknown-linux-musl': { nodeArch: 'arm64', platform: 'linux'  },
}

// Ensure the dist directory exists
fs.mkdirSync(path.join(__dirname, "dist"), { recursive: true });

const args = process.argv.slice(2); // Get arguments passed to the script
const mode = args.includes("--release") ? "release" : "debug";
const targetArg = args.find(arg => arg.startsWith("--target="));
const target = targetArg ? targetArg.split("=")[1] : null;

let crossPlatform = process.argv.length > 2 && process.argv[2] === "cross-platform";

function buildNapiModule(target, release = true) {
    const targetArg = target ? `--target ${target}` : "";
    const releaseArg = release ? "--release" : "";
    child_process.execSync(`npm run build -- ${releaseArg} ${targetArg}`, { stdio: 'inherit', cwd: path.join(__dirname, "napi") });
}

function buildProxyBin(target, release = true) {
    const targetArg = target ? `--target ${target}` : "";
    const releaseArg = release ? "--release" : "";
    child_process.execSync(`cargo build --bin desktop_proxy ${releaseArg} ${targetArg}`, {stdio: 'inherit', cwd: path.join(__dirname, "proxy")});
    
    if (target) {
        // Copy the resulting binary to the dist folder
        const targetFolder = release ? "release" : "debug";
        const ext = process.platform === "win32" ? ".exe" : "";
        const nodeArch = rustTargetsMap[target].nodeArch;
        fs.copyFileSync(path.join(__dirname, "target", target, targetFolder, `desktop_proxy${ext}`), path.join(__dirname, "dist", `desktop_proxy.${process.platform}-${nodeArch}${ext}`));
    }
}

function installTarget(target) {
    child_process.execSync(`rustup target add ${target}`, { stdio: 'inherit', cwd: __dirname });
}

if (!crossPlatform && !target) {
    console.log(`Building native modules in ${mode} mode for the native architecture`);
    buildNapiModule(false, mode === "release");
    buildProxyBin(false, mode === "release");
    return;
}

if (target) {
    console.log(`Building for target: ${target} in ${mode} mode`);
    installTarget(target);
    buildNapiModule(target, mode === "release");
    buildProxyBin(target, mode === "release");
    return;
}

// Filter the targets based on the current platform, and build for each of them
let platformTargets = Object.entries(rustTargetsMap).filter(([_, { platform: p }]) => p === process.platform);
console.log("Cross building native modules for the targets: ", platformTargets.map(([target, _]) => target).join(", "));

// When building for Linux, we need to set some environment variables to allow cross-compilation
if (process.platform === "linux") {
    process.env["PKG_CONFIG_ALLOW_CROSS"] = "1";
    process.env["PKG_CONFIG_ALL_STATIC"] = "1";
}

platformTargets.forEach(([target, _]) => {
    installTarget(target);
    buildNapiModule(target);
    buildProxyBin(target);
});
