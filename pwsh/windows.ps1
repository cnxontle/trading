Add-Type -AssemblyName System.Windows.Forms

while ($true) {
    $input = [Console]::ReadLine()
    if ($input) {
        [System.Windows.Forms.Clipboard]::SetText($input)
        [System.Windows.Forms.SendKeys]::SendWait("^{v}")
    }
}