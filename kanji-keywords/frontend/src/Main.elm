module Main exposing (..)

import Browser exposing (Document)
import Css
import Debug exposing (log)
import Dict exposing (Dict)
import Html exposing (Attribute, Html, button, div, input, li, ol, span, text)
import Html.Attributes exposing (attribute, placeholder, style, value)
import Html.Events exposing (on, onClick, onInput)
import Html.Events.Extra exposing (targetValueIntParse)
import Http
import Json.Decode as Decode
import Json.Encode as Encode



-- MAIN


main =
    Browser.document
        { init = init
        , subscriptions = subscriptions
        , update = update
        , view = view
        }



-- MODEL


type alias WorkElement =
    { kanji : String
    , keyword : String
    , notes : String
    }


type alias KeyCandidate =
    { word : String
    , origin : String
    , freq : List Int
    }


type alias Frequency =
    List Int


type alias Model =
    { currentWork : WorkElement
    , kanji : String
    , keyword : String
    , notes : String
    , freq : List Int
    , workElements : List WorkElement
    , suggestions : List KeyCandidate
    , currentWorkIndex : Int
    , currentHighlightWorkElementIndex : Int
    , currentHighlightSuggestionIndex : Int
    , userMessage : String
    }


init : () -> ( Model, Cmd Msg )
init _ =
    let
        model =
            { currentWork = { kanji = "", keyword = "", notes = "" }
            , kanji = ""
            , keyword = "loading..."
            , notes = ""
            , freq = []
            , suggestions = []

            -- , workElements = [ WorkElement "a" "first" "", WorkElement "b" "second" "asd", WorkElement "c" "third" "" ]
            , workElements = []
            , currentWorkIndex = -1
            , currentHighlightWorkElementIndex = -1
            , currentHighlightSuggestionIndex = -1
            , userMessage = ""
            }
    in
    -- update NextWorkElement model
    ( model, getWorkElements )



-- SUBSCRIPTIONS


subscriptions : Model -> Sub Msg
subscriptions _ =
    Sub.none



-- UPDATE


type
    Msg
    -- work elements
    = NextWorkElement
    | SelectWorkElement Int
    | HighlightWorkElement Int
    | UnHighlightWorkElement Int
      -- suggestions
    | SelectSuggestion Int
    | HighlightSuggestion Int
    | UnHighlightSuggestion Int
    | SortSuggestionsByFreq
    | SortSuggestionsByOrigin
      -- inputs
    | KeywordInput String
    | NotesInput String
    | KeywordSubmitClick
      -- Http responses
    | KeywordSubmitReady (Result Http.Error String)
    | WorkElementsReady (Result Http.Error (List WorkElement))
    | KeywordFrequencyReady (Result Http.Error (List Int))
    | SuggestionsReady (Result Http.Error (List KeyCandidate))


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        KeywordSubmitClick ->
            if String.length model.keyword > 0 then
                ( model, submitKeyword model )

            else
                ( { model | userMessage = "Error: keyword length must be non-zero" }, Cmd.none )

        KeywordSubmitReady result ->
            case result of
                Ok body ->
                    let
                        newElement =
                            { kanji = model.kanji
                            , keyword = model.keyword
                            , notes = model.notes
                            }

                        newWork =
                            updateWorkElement model.currentWorkIndex newElement model.workElements

                        newModel =
                            { model | workElements = newWork }
                    in
                    if String.length body > 0 then
                        ( { model | userMessage = "Error submitting keyword. Details:" ++ body }, Cmd.none )

                    else
                        update NextWorkElement newModel

                Err _ ->
                    ( { model | userMessage = "Error submitting keyword. Details unknown." }, Cmd.none )

        NextWorkElement ->
            update (SelectWorkElement (model.currentWorkIndex + 1)) model

        SelectWorkElement index ->
            let
                newModel =
                    chooseWorkElement index model
            in
            if String.length newModel.keyword > 1 then
                ( newModel, Cmd.batch [ getKeywordSuggestions newModel.kanji, getKeywordFrequency newModel.keyword ] )

            else
                ( newModel, Cmd.batch [ getKeywordSuggestions newModel.kanji ] )

        HighlightWorkElement index ->
            ( { model | currentHighlightWorkElementIndex = index }, Cmd.none )

        UnHighlightWorkElement index ->
            if model.currentHighlightWorkElementIndex == index then
                ( { model | currentHighlightWorkElementIndex = -1 }, Cmd.none )

            else
                ( model, Cmd.none )

        SelectSuggestion index ->
            let
                newSuggestion =
                    Maybe.withDefault (KeyCandidate "Error" "Error" [ 0 ]) (get index model.suggestions)

                newModel =
                    { model | keyword = newSuggestion.word }
            in
            ( newModel, getKeywordFrequency newModel.keyword )

        HighlightSuggestion index ->
            ( { model | currentHighlightSuggestionIndex = index }, Cmd.none )

        UnHighlightSuggestion index ->
            if model.currentHighlightSuggestionIndex == index then
                ( { model | currentHighlightSuggestionIndex = -1 }, Cmd.none )

            else
                ( model, Cmd.none )

        SortSuggestionsByFreq ->
            ( { model | suggestions = List.reverse (List.sortWith compareSuggestions model.suggestions) }, Cmd.none )

        SortSuggestionsByOrigin ->
            ( { model | suggestions = List.sortBy .origin model.suggestions }, Cmd.none )

        KeywordInput word ->
            if String.length word >= 2 then
                ( { model | keyword = word }, getKeywordFrequency word )

            else
                ( { model | keyword = word }, Cmd.none )

        NotesInput word ->
            ( { model | notes = word }, Cmd.none )

        WorkElementsReady result ->
            case result of
                Ok elements ->
                    let
                        newModel =
                            { model | workElements = elements, userMessage = "" }
                    in
                    update NextWorkElement newModel

                Err _ ->
                    ( { model | userMessage = "Error getting workElements" }, Cmd.none )

        KeywordFrequencyReady result ->
            case result of
                Ok freq ->
                    ( { model | freq = freq, userMessage = "" }, Cmd.none )

                Err _ ->
                    ( { model | userMessage = "Error getting keyword frequency" }, Cmd.none )

        SuggestionsReady result ->
            case result of
                Ok suggestions ->
                    let
                        newModel =
                            { model | suggestions = suggestions }
                    in
                    update SortSuggestionsByFreq newModel

                Err _ ->
                    ( { model | userMessage = "Error getting keyword suggections" }, Cmd.none )


chooseWorkElement : Int -> Model -> Model
chooseWorkElement index model =
    let
        selected =
            Maybe.withDefault (WorkElement "X" "Error" "An error occurred") (get index model.workElements)
    in
    { model
        | currentWorkIndex = index
        , kanji = selected.kanji
        , keyword = selected.keyword
        , notes = selected.notes
    }


updateWorkElement : Int -> WorkElement -> List WorkElement -> List WorkElement
updateWorkElement index newElement list =
    let
        updator i elem =
            if i == index then
                newElement

            else
                elem
    in
    List.indexedMap updator list


compareSuggestions : KeyCandidate -> KeyCandidate -> Order
compareSuggestions a b =
    let
        afreq =
            Maybe.withDefault 0 (get 0 a.freq)
                + Maybe.withDefault 0 (get 1 a.freq)

        bfreq =
            Maybe.withDefault 0 (get 0 b.freq)
                + Maybe.withDefault 0 (get 1 b.freq)
    in
    case compare afreq bfreq of
        LT ->
            LT

        EQ ->
            EQ

        GT ->
            GT


get : Int -> List a -> Maybe a
get index list =
    List.head (List.drop index list)


getWorkElements : Cmd Msg
getWorkElements =
    Http.get
        { url = "http://localhost:9000/api/work"
        , expect = Http.expectJson WorkElementsReady workElementsDecoder
        }


workElementsDecoder : Decode.Decoder (List WorkElement)
workElementsDecoder =
    Decode.list
        (Decode.map3 WorkElement
            (Decode.index 0 Decode.string)
            (Decode.index 1 Decode.string)
            (Decode.index 2 Decode.string)
        )


getKeywordFrequency : String -> Cmd Msg
getKeywordFrequency keyword =
    Http.get
        { url = "http://localhost:9000/api/frequency/" ++ keyword
        , expect = Http.expectJson KeywordFrequencyReady keywordFrequencyDecoder
        }


keywordFrequencyDecoder : Decode.Decoder (List Int)
keywordFrequencyDecoder =
    Decode.list Decode.int


getKeywordSuggestions : String -> Cmd Msg
getKeywordSuggestions kanji =
    Http.get
        { url = "http://localhost:9000/api/suggestions/" ++ kanji
        , expect = Http.expectJson SuggestionsReady keywordSuggestionsDecoder
        }


keywordSuggestionsDecoder : Decode.Decoder (List KeyCandidate)
keywordSuggestionsDecoder =
    Decode.list
        (Decode.map3 KeyCandidate
            (Decode.field "word" Decode.string)
            (Decode.field "origin" Decode.string)
            (Decode.field "freq" (Decode.list Decode.int))
        )


submitKeyword : Model -> Cmd Msg
submitKeyword model =
    Http.post
        { url = "http://localhost:9000/api/submit"
        , body = Http.jsonBody (submitKeywordEncoder model)
        , expect = Http.expectString KeywordSubmitReady
        }


submitKeywordEncoder : Model -> Encode.Value
submitKeywordEncoder model =
    Encode.object
        [ ( "kanji", Encode.string model.kanji )
        , ( "keyword", Encode.string model.keyword )
        , ( "notes", Encode.string model.notes )
        ]



-- VIEW


view : Model -> Document Msg
view model =
    Document "Kanji" [ render model ]


renderSingleWorkElement : Model -> Int -> WorkElement -> Html Msg
renderSingleWorkElement model index elem =
    div
        [ style "padding" "2px 0"
        ]
        [ span
            [ style "display" "inline-block"
            , style "width" "50px"
            , value (String.fromInt index)
            , on "mouseenter" (Decode.map HighlightWorkElement targetValueIntParse)
            , on "mouseleave" (Decode.map UnHighlightWorkElement targetValueIntParse)
            , if model.currentHighlightWorkElementIndex == index then
                style "background-color" "rgb(250, 250, 250)"

              else
                style "background-color" ""
            ]
            [ text (String.fromInt index ++ ".") ]
        , span
            [ style "padding" "0 10px 0 0"
            , style "background-color" "rgb(210, 200, 200)"
            ]
            [ text elem.kanji ]
        , span
            [ style "display" "inline-block"
            , style "width" "120px"
            , style "background-color" "rgb(200, 210, 200)"
            ]
            [ text elem.keyword ]
        , span
            [ style "display" "inline-block"
            , style "min-width" "150px"
            , style "background-color" "rgb(200, 200, 210)"
            ]
            [ text elem.notes ]
        ]


renderWorkElements : Model -> Html Msg
renderWorkElements model =
    let
        partial =
            renderSingleWorkElement model
    in
    div
        [ style "display" "inline-block"
        , style "height" "500px"
        , style "overflow" "scroll"
        , on "click" (Decode.map SelectWorkElement targetValueIntParse)
        ]
        (List.indexedMap partial model.workElements)


keywordFrequencyRender : Model -> String
keywordFrequencyRender model =
    let
        maybeCorpus =
            List.head model.freq

        maybeSubs =
            List.head (List.drop 1 model.freq)
    in
    case ( maybeCorpus, maybeSubs ) of
        ( Just c, Just s ) ->
            "Corpus: " ++ String.fromInt c ++ " Subs: " ++ String.fromInt s

        _ ->
            "Frequency unknown"


frequencyRender : List Int -> String
frequencyRender freq =
    let
        maybeCorpus =
            List.head freq

        maybeSubs =
            List.head (List.drop 1 freq)
    in
    case ( maybeCorpus, maybeSubs ) of
        ( Just c, Just s ) ->
            " " ++ String.fromInt c ++ " " ++ String.fromInt s

        _ ->
            "Frequency unknown"


renderSingleSuggestion : Model -> Int -> KeyCandidate -> Html Msg
renderSingleSuggestion model index suggest =
    div
        [ style "padding" "2px 0"
        ]
        [ span
            [ style "display" "inline-block"
            , style "width" "50px"
            , value (String.fromInt index)
            , on "mouseover" (Decode.map HighlightSuggestion targetValueIntParse)
            , on "mouseleave" (Decode.map UnHighlightSuggestion targetValueIntParse)
            , if model.currentHighlightSuggestionIndex == index then
                style "background-color" "rgb(250, 250, 250)"

              else
                style "background-color" ""
            ]
            [ text (String.fromInt index ++ ".") ]
        , span
            [ style "display" "inline-block"
            , style "width" "100px"
            ]
            [ text (suggest.origin ++ ": ") ]
        , span
            [ style "display" "inline-block"
            , style "width" "200px"
            ]
            [ text suggest.word ]
        , span
            [ style "display" "inline-block"
            , style "width" "70px"
            ]
            [ text (String.fromInt <| Maybe.withDefault 0 <| get 0 suggest.freq) ]
        , span
            [ style "display" "inline-block"
            , style "width" "70px"
            ]
            [ text (String.fromInt <| Maybe.withDefault 0 <| get 1 suggest.freq) ]
        ]


renderKeywordSuggestions : Model -> Html Msg
renderKeywordSuggestions model =
    let
        partial =
            renderSingleSuggestion model
    in
    div
        [ style "display" "inline-block"
        , style "height" "300px"
        , style "overflow" "scroll"
        , on "click" (Decode.map SelectSuggestion targetValueIntParse)
        ]
        (List.indexedMap partial model.suggestions)


render : Model -> Html Msg
render model =
    div []
        [ -- Keyword submit
          div
            [ style "background-color" "rgb(250, 250, 250)"
            ]
            [ div [] [ text model.userMessage ]
            , span [ style "padding" "0 10px" ] [ text model.kanji ]
            , span [] [ input [ placeholder "Keyword", value model.keyword, onInput KeywordInput ] [] ]
            , span [ style "padding" "0 10px" ] [ text ("Corpus: " ++ (String.fromInt <| Maybe.withDefault 0 <| get 0 model.freq)) ]
            , span [ style "padding" "0 10px" ] [ text ("Subs: " ++ (String.fromInt <| Maybe.withDefault 0 <| get 1 model.freq)) ]
            , span [] [ button [ onClick KeywordSubmitClick ] [ text "Submit" ] ]
            , span [] [ input [ placeholder "Notes", value model.notes, onInput NotesInput ] [] ]
            ]

        -- Suggestions
        , div
            [ style "background-color" "rgb(230, 230, 230)"
            , style "display" "inline-block"
            , style "vertical-align" "top"
            ]
            [ div
                [ style "display" "inline-block"
                ]
                [ span
                    [ style "display" "inline-block"
                    , style "width" "350px"
                    , onClick SortSuggestionsByOrigin
                    ]
                    [ text "Keyword suggestion" ]
                , span
                    [ style "display" "inline-block"
                    , style "width" "70px"
                    , onClick SortSuggestionsByFreq
                    ]
                    [ text "Corpus" ]
                , span
                    [ style "display" "inline-block"
                    , style "width" "70px"
                    , onClick SortSuggestionsByFreq
                    ]
                    [ text "Subs" ]
                ]
            , div [] [ renderKeywordSuggestions model ]
            ]

        -- WorkElement select
        , div
            [ style "background-color" "rgb(210, 210, 210)"
            , style "display" "inline-block"
            , style "vertical-align" "top"
            ]
            [ div [] [ text "Work Elements Progress" ]
            , div [] [ renderWorkElements model ]
            ]
        ]
