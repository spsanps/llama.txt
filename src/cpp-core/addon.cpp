#include <napi.h>

Napi::Value Add(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    // Check if the correct number of arguments are passed
    if (info.Length() < 2) {
        Napi::TypeError::New(env, "Two arguments expected").ThrowAsJavaScriptException();
        return env.Undefined();
    }

    // Check if the arguments are numbers
    if (!info[0].IsNumber() || !info[1].IsNumber()) {
        Napi::TypeError::New(env, "Number arguments expected").ThrowAsJavaScriptException();
        return env.Undefined();
    }

    double arg0 = info[0].As<Napi::Number>().DoubleValue();
    double arg1 = info[1].As<Napi::Number>().DoubleValue();
    double sum = arg0 + arg1;

    return Napi::Number::New(env, sum);
}

Napi::Object Init(Napi::Env env, Napi::Object exports) {
    exports.Set(Napi::String::New(env, "add"), Napi::Function::New(env, Add));
    return exports;
}

NODE_API_MODULE(addon, Init)
