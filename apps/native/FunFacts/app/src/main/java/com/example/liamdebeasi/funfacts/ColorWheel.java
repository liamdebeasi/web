package com.example.liamdebeasi.funfacts;

import android.graphics.Color;

import java.util.Random;

/**
 * Created by liamdebeasi on 2/13/17.
 */

public class ColorWheel {
    // Fields (members vars) - properties about the object
    public String[] mColors = {
            "#39add1", // light blue
            "#3079ab", // dark blue
            "#c25975", // mauve
            "#e15258", // red
            "#f9845b", // orange
            "#838cc7", // lavender
            "#7d669e", // purple
            "#53bbb4", // aqua
            "#51b46d", // green
            "#e0ab18", // mustard
            "#637a91", // dark gray
            "#f092b0", // pink
            "#b7c0c7"  // light gray
    };

    // methods - actions the object can take
    public int getColor() {

        // randomly select a fact

        Random randomGenerator = new Random();
        int randomNumber = randomGenerator.nextInt(mColors.length);
        int colorAsInt = Color.parseColor(mColors[randomNumber]);

        return colorAsInt;
    }
}
