import fs from 'fs';
import path from 'path';
import { execSync, spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');
const EXE_PATH = path.join(PROJECT_ROOT, 'public', 'releases', 'MasterCloudSetup.exe');

async function main() {
  console.log('🔍 Retrieving GitHub Token from Git Credential Manager...');
  const credRes = spawnSync('git', ['credential', 'fill'], {
    input: 'protocol=https\nhost=github.com\n\n',
    encoding: 'utf8',
  });
  const credOutput = credRes.stdout || '';
  const passMatch = credOutput.match(/password=([^\r\n]+)/);
  if (!passMatch) {
    throw new Error('Failed to extract GitHub token from git credentials');
  }
  const token = passMatch[1].trim();
  console.log('✅ GitHub Token retrieved!');

  if (!fs.existsSync(EXE_PATH)) {
    throw new Error(`File not found: ${EXE_PATH}`);
  }

  const stat = fs.statSync(EXE_PATH);
  console.log(`📦 Found installer: ${EXE_PATH} (${(stat.size / 1024 / 1024).toFixed(2)} MB)`);

  const owner = 'InukaMinsara';
  const repo = 'master-cloud';
  const tag = 'v1.0.0';

  // 1. Check if release already exists
  console.log(`🌐 Checking if release ${tag} exists...`);
  const checkRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/releases/tags/${tag}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'User-Agent': 'MasterCloud-Deployer',
      Accept: 'application/vnd.github.v3+json',
    },
  });

  let releaseData;
  if (checkRes.ok) {
    releaseData = await checkRes.json();
    console.log(`ℹ️ Existing release found: ID ${releaseData.id}`);
  } else {
    console.log(`🚀 Creating new release ${tag}...`);
    const createRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/releases`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'User-Agent': 'MasterCloud-Deployer',
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tag_name: tag,
        target_commitish: 'master',
        name: 'Master Cloud Desktop v1.0.0',
        body: 'Official Master Cloud Desktop for Windows.\n- 10 TB Virtual Drive\n- Native File Explorer Integration\n- Auto-Connect with Website\n- Per-User Data Isolation',
        draft: false,
        prerelease: false,
      }),
    });

    if (!createRes.ok) {
      const errText = await createRes.text();
      throw new Error(`Failed to create release: ${createRes.status} ${errText}`);
    }
    releaseData = await createRes.json();
    console.log(`✅ Release created: ID ${releaseData.id}`);
  }

  // 2. Check if asset already exists and delete if present
  const assets = releaseData.assets || [];
  const existingAsset = assets.find((a) => a.name === 'MasterCloudSetup.exe');
  if (existingAsset) {
    console.log(`🗑️ Deleting older asset: ${existingAsset.id}...`);
    await fetch(`https://api.github.com/repos/${owner}/${repo}/releases/assets/${existingAsset.id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
        'User-Agent': 'MasterCloud-Deployer',
      },
    });
    console.log('✅ Deleted old asset');
  }

  // 3. Upload asset
  const uploadUrl = `https://uploads.github.com/repos/${owner}/${repo}/releases/${releaseData.id}/assets?name=MasterCloudSetup.exe`;
  console.log(`⬆️ Uploading MasterCloudSetup.exe (${(stat.size / 1024 / 1024).toFixed(2)} MB) to GitHub Releases...`);

  const fileStream = fs.createReadStream(EXE_PATH);
  const uploadRes = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'User-Agent': 'MasterCloud-Deployer',
      'Content-Type': 'application/octet-stream',
      'Content-Length': stat.size.toString(),
    },
    body: fileStream,
    duplex: 'half',
  });

  if (!uploadRes.ok) {
    const errText = await uploadRes.text();
    throw new Error(`Upload failed: ${uploadRes.status} ${errText}`);
  }

  const assetData = await uploadRes.json();
  console.log(`🎉 SUCCESS! Asset uploaded!`);
  console.log(`📥 Direct Download URL: ${assetData.browser_download_url}`);
}

main().catch((err) => {
  console.error('❌ Error:', err);
  process.exit(1);
});
