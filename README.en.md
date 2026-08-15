# Nekozekenchi

[日本語](README.md)

Nekozekenchi is a web app that uses your webcam and MediaPipe Pose Landmarker to detect slouching based on changes in head position. It also supports hands-free controls with MediaPipe Gesture Recognizer.

Camera footage and pose landmarks are processed entirely on your device and are never sent to a server.

## For users

### How to use

1. Position your camera at about eye level, far enough away to capture your face and shoulders from the front.
2. Start the camera and hold good posture for three seconds.
3. Then hold a slouched posture for three seconds.
4. The app alerts you when your posture stays beyond the selected sensitivity threshold for the configured amount of time.

For more reliable detection, avoid camera angles that look sharply up or down at you.

Hold one of the following gestures in front of the camera. The app displays recognition progress before performing the action. Lower your hands after an action before using another gesture.

- Make a T with both hands: pause detection
- Show a victory sign: resume from pause
- Show one open palm: stop the camera and detection
- Put your palms together at chest height: recalibrate
- Put your index finger to your lips: mute
- Give a thumbs up: unmute

To prevent accidental actions, hold the open palm for about 1.5 seconds and the other gestures for about one second.
Short electronic tones play when gesture recognition starts and when the hold completes and the action runs. Only the stop action uses a descending shutdown tone. These tones use the same volume and mute settings as posture alerts.

### How detection works

The app uses the head positions recorded for your good and slouched postures as calibration points. It scores your current posture based on how close the Y-coordinate of your nose is to the slouched position. If you remain slouched after an alert, the app can alert you again after a 12-second interval. Recovering your posture clears this cooldown.

## For developers

### Requirements

- Node.js
- npm
- `mkcert` only if you need HTTPS access from another device on your LAN

### Start the development server

```bash
npm install
npm run dev
```

Open `http://localhost:5187` in your browser.

### Test over HTTPS from another device on your LAN

Browsers require HTTPS to use the camera when accessing the app from another device on the same LAN. Set up `mkcert` once, then start the HTTPS development server:

```bash
brew install mkcert
mkcert -install
npm run dev:https
```

Open the `https://<IP-address>:5187` URL shown in the startup log on the other device. If your IP address changes, the development certificate in `.cert` is regenerated the next time the server starts.

### Test, build, and preview

```bash
npm test
npm run build
npm run preview
```

The preview server runs at `http://localhost:5188`. To access it from another device on the same LAN, use `npm run preview:https`.

Opening the generated `dist/index.html` directly in a browser does not provide camera access because of browser security restrictions. Start the development or preview server when testing the camera.

## Deployment

The app is published through Cloudflare Pages by deploying to Cloudflare Workers from GitHub Actions.

| Environment | Worker | Automatic deployment trigger | Access |
| --- | --- | --- | --- |
| Development | `nekozekenchi-dev` | The `main` branch is updated | Restricted by Cloudflare Access |
| Production | `nekozekenchi` | A `v*` tag is pushed | Public |

Configure the following repository secrets:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

To keep the development environment private, create a Cloudflare Zero Trust Access Application and an Allow policy for the `nekozekenchi-dev` hostname.

### Manual deployment

To deploy to the development environment:

```bash
npm run build
npm run deploy:dev
```

To deploy to production:

```bash
npm run build
npm run deploy:prod
```

`deploy:prod` deploys only when the current commit has a `v*` tag that matches the version in `package.json`. If the commit has no tag, the command exits successfully without deploying. If the tag and package version do not match, it fails.

Deployments use `wrangler deploy` rather than `wrangler versions upload`, because uploading a version alone does not update the version currently serving traffic.

## Releases

This process assumes that the `main` branch is protected and can only be updated through pull requests.

### Release workflow

1. Update the version in `package.json` and `package-lock.json` on a release branch.
2. Push the release branch and open a pull request.
3. Merge the pull request into `main`. This automatically deploys the new version to the development environment.
4. Verify the release in the development environment.
5. Tag the merged commit on `main` with a `v*` tag matching the package version, then push the tag.
6. Pushing the tag automatically deploys the release to production.

### 1. Prepare a release branch

The following command creates a branch such as `release/v1.0.2`, commits the version update, and pushes the branch:

```bash
npm run pre-release
```

By default, it increments the patch version. To increment the minor or major version instead:

```bash
npm run pre-release -- minor
npm run pre-release -- major
```

To preview the next version and branch name without making any changes:

```bash
npm run pre-release -- --dry-run
```

`pre-release` does not open or merge a pull request, and it does not create a tag. After it pushes the branch, open a release pull request and merge it into `main`.

#### Prepare the branch manually

For example, to prepare version `1.0.2`:

```bash
git switch -c release/v1.0.2 origin/main
npm version patch --no-git-tag-version
git add package.json package-lock.json
git commit -m "chore: release v1.0.2"
git push origin release/v1.0.2
```

For a minor or major release, replace `patch` with `minor` or `major`.

### 2. Tag the merged commit

After merging the release pull request, update your local `main` branch and create a tag. The tag must match the version in `package.json`.

```bash
git switch main
git pull --ff-only origin main
git tag v1.0.2
git push origin v1.0.2
```

Pushing the tag starts the production deployment in GitHub Actions. The deployment is rejected if the tag does not match the version in `package.json`.

## License

This project is licensed under the MIT License. It also uses the following third-party resources. See `public/THIRD_PARTY_NOTICES.txt` for details.

- The bundled MediaPipe Tasks Vision WASM files and Pose Landmarker Lite model are provided under the Apache License 2.0.
- Some bundled notification sounds (cat sounds) come from [Pocket Sound](https://pocket-se.info/). Credit links are included in the app and the third-party notices as required by its terms of use.
- Parts of the UI are based on HTML code snippets from the [Digital Agency Design System](https://design.digital.go.jp/dads/). The snippets are provided under the MIT License.
