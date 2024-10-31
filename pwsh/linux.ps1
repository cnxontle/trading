while ($true) {
    $input = [Console]::ReadLine()
    if ($input) {
        & xdotool type "$input"
    }
}