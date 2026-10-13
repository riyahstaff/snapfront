#!/usr/bin/env python3
"""Validate downloaded Snapfront AAB contents, not merely EAS commit metadata.
Usage: python3 mobile/scripts/verify-android-artifact.py file.aab --version-code 22
This is an integrity/content check, not a malware scan or Google Play approval.
"""
import argparse
import hashlib
import io
import json
from pathlib import Path
import zipfile
from PIL import Image


def text_present(data, text):
    return text.encode('utf-8') in data or text.encode('utf-16-le') in data


def manifest_value(data, name):
    # AAPT protobuf XML attributes encode their literal value in field 3 (0x1a).
    # These version/package strings are shorter than 128 bytes (one-byte length).
    marker = name.encode() + b'\x1a'
    offset = data.find(marker)
    if offset < 0:
        raise ValueError(f'Missing manifest {name}')
    offset += len(marker)
    length = data[offset]
    if length >= 128:
        raise ValueError(f'Unexpected long manifest {name}')
    return data[offset + 1:offset + 1 + length].decode('utf-8')


def verify(artifact, version_code):
    root = Path(__file__).resolve().parents[1]
    expected_version = json.loads((root / 'app.json').read_text())['expo']['version']
    with zipfile.ZipFile(artifact) as archive:
        if archive.testzip() is not None:
            raise ValueError('Artifact CRC integrity failure')
        if 'BundleConfig.pb' not in archive.namelist():
            raise ValueError('Expected an AAB, not an APK')
        manifest = archive.read('base/manifest/AndroidManifest.xml')
        package = manifest_value(manifest, 'package')
        native_version = manifest_value(manifest, 'versionName')
        native_code = manifest_value(manifest, 'versionCode')
        assert package == 'com.sidebanc.snapfront', package
        assert native_version == expected_version, (native_version, expected_version)
        assert native_code == str(version_code), (native_code, version_code)
        bundle = archive.read('base/assets/index.android.bundle')
        for text in ['Your vision.', 'Beautifully built.', 'Theme demos', 'ThemeCarousel', 'ChromeHero', 'offline previews', 'Retry image', 'Development preview']:
            if not text_present(bundle, text):
                raise ValueError(f'Compiled UI missing {text!r}')
        for text in ['Snap a photo.', 'Get a storefront.']:
            if text_present(bundle, text):
                raise ValueError(f'Historical Home string found in compiled UI: {text!r}')
        for text in ['Digital Design Studio', '/api/digital-designs/create', '/digital-design/preview', '/digital-design/attach']:
            if not text_present(bundle, text):
                raise ValueError(f'Digital editor missing from compiled UI: {text!r}')
        for text in ['Storefront Photo Agent', '/api/image-assistant/jobs', 'Digital Photo Studio', 'Recover the same request', 'Preview refreshed.']:
            if not text_present(bundle, text):
                raise ValueError(f'New image tools missing from compiled UI: {text!r}')
        for text in ['Show original artwork', 'Premium collection', 'design_revision']:
            if not text_present(bundle, text):
                raise ValueError(f'Premium design collection missing from compiled UI: {text!r}')
        image_hashes = {}
        for name in archive.namelist():
            if name.endswith(('.webp', '.jpg', '.png')):
                image_hashes.setdefault(hashlib.sha256(archive.read(name)).hexdigest(), name)
        previews = list((root / 'assets/theme-previews').glob('*.webp'))
        assert len(previews) == 105, len(previews)
        for source in previews + [root / 'assets/chrome-hero.jpg']:
            digest = hashlib.sha256(source.read_bytes()).hexdigest()
            if digest not in image_hashes:
                raise ValueError(f'Image bytes not embedded in artifact: {source.name}')
        digital_previews = list((root / 'assets/digital-designs').glob('*.png'))
        assert len(digital_previews) == 50, len(digital_previews)
        for source in digital_previews:
            if hashlib.sha256(source.read_bytes()).hexdigest() not in image_hashes:
                # Android AAPT losslessly recompresses PNG drawables. Container hashes may
                # change, but the exact source dimensions and RGBA pixels must survive.
                resource_name = 'assets_digitaldesigns_' + source.stem.replace('-', '') + '.png'
                candidates = [name for name in archive.namelist() if name.endswith('/' + resource_name)]
                if len(candidates) != 1:
                    raise ValueError(f'Digital design image not embedded in artifact: {source.name}')
                original = Image.open(source).convert('RGBA')
                packaged = Image.open(io.BytesIO(archive.read(candidates[0]))).convert('RGBA')
                if original.size != packaged.size or original.tobytes() != packaged.tobytes():
                    raise ValueError(f'Packaged digital design pixels differ from source: {source.name}')
    result = {'artifact': str(artifact.resolve()), 'package': package, 'version': native_version,
              'version_code': native_code, 'theme_previews_verified': len(previews),
              'digital_design_previews_verified': len(digital_previews), 'digital_editor_verified': True, 'separate_image_studios_verified': True,
              'android_png_lossless_pixel_verification': True,
              'premium_digital_collection_verified': True,
              'chrome_home_verified': True, 'bytes': artifact.stat().st_size,
              'sha256': hashlib.sha256(artifact.read_bytes()).hexdigest()}
    return result


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('artifact', type=Path)
    parser.add_argument('--version-code', required=True)
    args = parser.parse_args()
    print(json.dumps(verify(args.artifact, args.version_code), indent=2))
