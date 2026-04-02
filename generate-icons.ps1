# AutoSlay — Icon Generator
# Double-click this file (or run in PowerShell) to create the PNG icons.
# Then run: npm run build
# Then reload the extension in chrome://extensions

$icons = @{
  "icon16.png"  = "iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAVElEQVR42rXTQQoAIAhEUZfe/8K1F8c/EQauzGdYRWaen4gVQC0EqLCDEOjyLeAW11zQBsIRoLm0QO0+zSGokzqNDahZWNdIxSPgwvIpE7r7mV7iAnY3IWtAX7UdAAAAAElFTkSuQmCC"
  "icon48.png"  = "iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAAxUlEQVR42u2ZSw6AIAxEZ8n9L6xXIDifqkPC0jqvAfrDWut680YBClCAHwOwlg3AtSQA7kUFUIt5AoGp4ne/x2TxO3YKoBYfAWDfqyMAlffZNjHd+1YA5ZMsB0jFkwI4xEsB0im3FMCRnT4COPE+OzOFKktkHzcqgFu8NRKr7koUgPFSxQDUNQESwYcZLAuQLmowvZw8BlAVNWx7cP5sPIC7nKQCJMpJamsx4X1aczclntJeT4r/14DjEyOmTikLUIAC0PcNydo3JbC9o6EAAAAASUVORK5CYII="
  "icon128.png" = "iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAACIUlEQVR42u3dQZKDMBADwDny/w8nnwjxyOqt0j1GDcFmY+Z5no/0ZhwEABwIAAQAAUAAEAAEAAFAABAABAABQAAQAASAQ0n9A6Cg5HQco/huCKP4bgij+G4Io/huCKP8bgSj/PcOdgKCUf5uAG8jGOV/IsYfBUD5OZ91fO/njD0CgLM/6zOPsz9r7KsBKD/v89cBuGHWsxKAsz9zHOPszxz3KgDKzx0TAADcD+DWxS4AissHoGTKB4CzHwDlLwag/OyxAgCAy2LzLGfcFHWvcYwpEQAAFC9xjyXR7sfb44FI9/81AgBA7sHyO8ZiAMovBuDnbAAovxWA8osBKB8AAFoBKL8YgPKLAZjyAaD8VgDKLwawqfybdxADIPwqdCUA5RcDUH4xAN/7rgBX3Fkn3SsBED71BKB81RGA8oUnAMpXHQEoX3IGAAAAmh84AVD+tBGAoikfAM5+AJQPgPIBAAAA5QPQXj4AZVM+AJz9ACgfAOVvAuB9Adnj874A7wtwYJqRj8siAAAU3+OMOXH3LGesiHWvcYyHIt1rHOORaPcK57T/S1T78nY0AO8JWgbAzqF5Y44F4CVRSwHYOzBr3AAAkHUjpfwQADfvIHZL+a8D2LQjpvIPAfjVgTblCwZw63Zy6eX/FQAIu4o/BgCEHcUfBwDC2eLXAGiFsOW4rwFgFxIABAABQAAQAAQAAUAAEAAEAAFAABAABAABQACQ3+QLtnO99m0FKDEAAAAASUVORK5CYII="
}

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$folders = @(
    (Join-Path $scriptDir "public"),
    (Join-Path $scriptDir "dist")
)

foreach ($folder in $folders) {
    if (Test-Path $folder) {
        foreach ($name in $icons.Keys) {
            $bytes = [System.Convert]::FromBase64String($icons[$name])
            $path  = Join-Path $folder $name
            [System.IO.File]::WriteAllBytes($path, $bytes)
            Write-Host "✅ Written $path ($($bytes.Length) bytes)"
        }
    } else {
        Write-Host "⚠️  Folder not found, skipping: $folder"
    }
}

Write-Host ""
Write-Host "✅ Icons created! Now run:  npm run build"
Write-Host "   Then reload the extension in chrome://extensions"
