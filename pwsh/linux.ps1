while ($true) {
    $input = [Console]::ReadLine()
    if ($input) {
        echo $input | xclip -selection clipboard
        & xdotool key ctrl+v
    }
}