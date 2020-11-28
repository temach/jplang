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
import Platform.Cmd as Cmd



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
    , currentHighlightHistoryIndex : Int
    , userMessage : String
    , history : List String
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
            , currentHighlightHistoryIndex = -1
            , userMessage = ""
            , history = []
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
      -- history
    | SelectHistory Int
    | HighlightHistory Int
    | UnHighlightHistory Int
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
            if String.length newModel.keyword >= 2 then
                ( newModel, Cmd.batch [ getKeywordSuggestions newModel.kanji, getKeywordFrequency newModel.keyword ] )

            else
                ( { newModel | freq = [] }, Cmd.batch [ getKeywordSuggestions newModel.kanji ] )

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

                newCandidateHistory =
                    model.history ++ [ model.keyword ]

                newModel =
                    { model
                        | keyword = newSuggestion.word
                        , history = historyFilter newCandidateHistory
                    }
            in
            ( newModel, getKeywordFrequency newModel.keyword )

        HighlightSuggestion index ->
            ( { model | currentHighlightSuggestionIndex = index }, Cmd.none )

        UnHighlightSuggestion index ->
            if model.currentHighlightSuggestionIndex == index then
                ( { model | currentHighlightSuggestionIndex = -1 }, Cmd.none )

            else
                ( model, Cmd.none )

        SelectHistory index ->
            let
                newKeyword =
                    Maybe.withDefault "Error!" (get index model.history)

                newCandidateHistory =
                    model.history ++ [ model.keyword ]

                newModel =
                    { model
                        | keyword = newKeyword
                        , history = historyFilter newCandidateHistory
                    }
            in
            if String.length newModel.keyword >= 2 then
                ( newModel, getKeywordFrequency newModel.keyword )

            else
                ( { newModel | freq = [] }, Cmd.none )

        HighlightHistory index ->
            ( { model | currentHighlightHistoryIndex = index }, Cmd.none )

        UnHighlightHistory index ->
            if model.currentHighlightHistoryIndex == index then
                ( { model | currentHighlightHistoryIndex = -1 }, Cmd.none )

            else
                ( model, Cmd.none )

        SortSuggestionsByFreq ->
            ( { model | suggestions = List.reverse (List.sortWith compareSuggestions model.suggestions) }, Cmd.none )

        SortSuggestionsByOrigin ->
            ( { model | suggestions = List.sortBy .origin model.suggestions }, Cmd.none )

        KeywordInput word ->
            let
                newCandidateHistory =
                    model.history ++ [ model.keyword ]

                newModel =
                    { model
                        | keyword = word
                        , history = historyFilter newCandidateHistory
                    }
            in
            if String.length word >= 2 then
                ( newModel, getKeywordFrequency word )

            else
                ( { newModel | freq = [] }, Cmd.none )

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
                    ( { model | freq = [], userMessage = "Error getting keyword frequency" }, Cmd.none )

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


historyFilter : List String -> List String
historyFilter list =
    uniq (List.filter (\x -> String.length x >= 2) list)


uniq : List a -> List a
uniq list =
    case list of
        [] ->
            []

        [ a ] ->
            [ a ]

        a :: b :: more ->
            if a == b then
                uniq (a :: more)

            else
                a :: uniq (b :: more)


chooseWorkElement : Int -> Model -> Model
chooseWorkElement index model =
    let
        selected =
            Maybe.withDefault (WorkElement "X" "Error" "An error occurred") (get index model.workElements)

        newCandidateHistory =
            model.history ++ [ model.keyword ]
    in
    { model
        | currentWorkIndex = index
        , kanji = selected.kanji
        , keyword = selected.keyword
        , notes = selected.notes
        , history = historyFilter newCandidateHistory
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
        , style "display" "flex"
        ]
        [ span
            [ style "flex" "0 0 1.5rem"
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
            [ style "flex" "0 0 auto"
            , style "margin" "0 0.5rem"
            , style "background-color" "rgb(210, 200, 200)"
            ]
            [ text elem.kanji ]
        , span
            [ style "flex" "1 0 4rem"
            , style "margin" "0 0.5rem"
            , if String.length elem.keyword > 0 then
                style "background-color" "rgb(200, 210, 200)"

              else
                style "background-color" ""
            ]
            [ text elem.keyword ]
        , span
            [ style "flex" "10 1 auto"
            , if String.length elem.notes > 0 then
                style "background-color" "rgb(200, 200, 210)"

              else
                style "background-color" ""
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
        [ on "click" (Decode.map SelectWorkElement targetValueIntParse)
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
        , style "display" "flex"
        ]
        [ span
            [ style "flex" "0 0 1.5rem"
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
            [ style "flex" "0 0 6rem" ]
            [ text (suggest.origin ++ ": ") ]
        , span
            [ style "flex" "10 0 6rem" ]
            [ text suggest.word ]
        , span
            [ style "flex" "1 0 3rem" ]
            [ text (String.fromInt <| Maybe.withDefault 0 <| get 0 suggest.freq) ]
        , span
            [ style "flex" "1 0 3rem" ]
            [ text (String.fromInt <| Maybe.withDefault 0 <| get 1 suggest.freq) ]
        ]


renderKeywordSuggestions : Model -> Html Msg
renderKeywordSuggestions model =
    let
        partial =
            renderSingleSuggestion model
    in
    div
        [ on "click" (Decode.map SelectSuggestion targetValueIntParse) ]
        (List.indexedMap partial model.suggestions)


renderSubmitBar : Model -> Html Msg
renderSubmitBar model =
    div [ style "display" "flex" ]
        [ span
            [ style "flex" "1 0 auto" ]
            [ text model.kanji ]
        , span
            [ style "flex" "10 0 70px" ]
            [ input
                [ placeholder "Keyword"
                , value model.keyword
                , onInput KeywordInput
                , style "width" "100%"
                , style "box-sizing" "border-box"
                ]
                []
            ]
        , span
            [ style "flex" "1 0 auto" ]
            [ text ("Corpus: " ++ (String.fromInt <| Maybe.withDefault 0 <| get 0 model.freq)) ]
        , span
            [ style "flex" "1 0 auto" ]
            [ text ("Subs: " ++ (String.fromInt <| Maybe.withDefault 0 <| get 1 model.freq)) ]
        , span
            [ style "flex" "1 0 auto" ]
            [ button [ onClick KeywordSubmitClick ] [ text "Submit" ] ]
        , span
            [ style "flex" "10 0 70px" ]
            [ input
                [ placeholder "Notes"
                , value model.notes
                , onInput NotesInput
                , style "width" "100%"
                , style "box-sizing" "border-box"
                ]
                []
            ]
        ]


renderSingleHistory : Model -> Int -> String -> Html Msg
renderSingleHistory model index history =
    div
        [ style "padding" "2px 0"
        , style "display" "flex"
        ]
        [ span
            [ style "flex" "0 0 1.5rem"
            , value (String.fromInt index)
            , on "mouseover" (Decode.map HighlightHistory targetValueIntParse)
            , on "mouseleave" (Decode.map UnHighlightHistory targetValueIntParse)
            , if model.currentHighlightHistoryIndex == index then
                style "background-color" "rgb(250, 250, 250)"

              else
                style "background-color" ""
            ]
            [ text (String.fromInt index ++ ".") ]
        , span
            [ style "flex" "1 0 6rem" ]
            [ text history ]
        ]


renderHistory : Model -> Html Msg
renderHistory model =
    let
        partial =
            renderSingleHistory model
    in
    div
        [ on "click" (Decode.map SelectHistory targetValueIntParse) ]
        (List.take 100 (List.reverse (List.indexedMap partial model.history)))


render : Model -> Html Msg
render model =
    -- central css grid container
    div
        [ style "display" "grid"
        , style "grid-template-columns" "1px 2fr 1fr 2fr 1px"
        , style "grid-template-rows" "12vh 35vh 52vh"

        -- , style "grid-template-rows" "70px 200px 300px"
        ]
        [ -- Keyword submit
          div
            [ style "background-color" "rgb(250, 250, 250)"
            , style "grid-column" "2 / 5"
            , style "grid-row" "1 / 2"
            , style "overflow" "auto"
            ]
            [ div [] [ text model.userMessage ]
            , renderSubmitBar model
            ]

        -- Suggestions
        , div
            [ style "background-color" "rgb(230, 230, 230)"
            , style "grid-column" "2 / 4"
            , style "grid-row" "2 / 3"
            , style "overflow" "auto"
            ]
            [ div
                [ style "display" "flex" ]
                [ span
                    [ style "flex" "10 0 calc(1.5rem + 6rem + 6rem)"
                    , onClick SortSuggestionsByOrigin
                    ]
                    [ text "Keyword suggestion" ]
                , span
                    [ style "flex" "1 0 3rem"
                    , onClick SortSuggestionsByFreq
                    ]
                    [ text "Corpus" ]
                , span
                    [ style "flex" "1 0 3rem"
                    , onClick SortSuggestionsByFreq
                    ]
                    [ text "Subs" ]
                ]
            , renderKeywordSuggestions model
            ]

        -- WorkElement select
        , div
            [ style "background-color" "rgb(210, 210, 210)"
            , style "grid-column" "4 / 5"
            , style "grid-row" "2 / 4"
            , style "overflow" "auto"
            ]
            [ div [] [ text "Work Elements Progress" ]
            , renderWorkElements model
            ]

        -- Candidate History
        , div
            [ style "background-color" "rgb(200, 200, 200)"
            , style "grid-column" "3 / 4"
            , style "grid-row" "3 / 4"
            , style "overflow" "auto"
            ]
            [ div [] [ text "Keyword History" ]
            , div [] [ renderHistory model ]
            ]
        ]
