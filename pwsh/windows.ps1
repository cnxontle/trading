Add-Type -AssemblyName System.Windows.Forms

while ($true) {
    $input = [Console]::ReadLine()
    if ($input) {
        foreach ($char in $input.ToCharArray()) {
            [System.Windows.Forms.SendKeys]::SendWait($char)
            Start-Sleep -Milliseconds 5 
        }
    }
}